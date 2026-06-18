<?php
/**
 * 每日故事 API
 *
 * GET /api/stories.php?date=2026-06-15           → 获取指定日期的故事
 * GET /api/stories.php?from=2026-06-01&to=2026-06-15
 *                                                → 获取日期范围的故事
 * GET /api/stories.php?since=2026-06-10T12:00:00 → 增量同步（按 updated_at）
 * GET /api/stories.php?limit=30&offset=0         → 翻页（按日期倒序）
 * POST /api/stories.php                          → 推送今日故事（upsert）
 * Body: { "date": "2026-06-15", "stories": [{ "story_index": 1, "title": "", "content": "...", "value_dim": "工作", "completed": false }] }
 */
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

setCorsHeaders();

$user = Auth::requireAuth();
$userId = $user['sub'];
$db = Database::getInstance()->getConnection();

// ====================
// GET: 拉取故事
// ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $date  = $_GET['date'] ?? null;
    $from  = $_GET['from'] ?? null;
    $to    = $_GET['to'] ?? null;
    $since = $_GET['since'] ?? null;
    $limit = min((int) ($_GET['limit'] ?? 30), 100);
    $offset = max((int) ($_GET['offset'] ?? 0), 0);

    // 增量同步模式
    if ($since) {
        $stmt = $db->prepare(
            'SELECT id, story_date, story_index, title, content, value_dim, completed, created_at, updated_at
             FROM stories WHERE user_id = ? AND updated_at > ?
             ORDER BY updated_at ASC LIMIT ?'
        );
        $stmt->execute([$userId, $since, SYNC_BATCH_SIZE]);
    }
    // 指定单日
    elseif ($date) {
        $stmt = $db->prepare(
            'SELECT id, story_date, story_index, title, content, value_dim, completed, created_at, updated_at
             FROM stories WHERE user_id = ? AND story_date = ?
             ORDER BY story_index ASC'
        );
        $stmt->execute([$userId, $date]);
    }
    // 日期范围
    elseif ($from && $to) {
        $stmt = $db->prepare(
            'SELECT id, story_date, story_index, title, content, value_dim, completed, created_at, updated_at
             FROM stories WHERE user_id = ? AND story_date BETWEEN ? AND ?
             ORDER BY story_date DESC, story_index ASC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$userId, $from, $to, $limit, $offset]);
    }
    // 翻页（按日期倒序）
    else {
        $stmt = $db->prepare(
            'SELECT id, story_date, story_index, title, content, value_dim, completed, created_at, updated_at
             FROM stories WHERE user_id = ?
             ORDER BY story_date DESC, story_index ASC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$userId, $limit, $offset]);
    }

    $rows = $stmt->fetchAll();

    Auth::jsonSuccess([
        'stories'     => $rows,
        'count'       => count($rows),
        'server_time' => nowISO8601()
    ]);
}

// ====================
// POST: 推送故事 (upsert batch)
// ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    $date = $body['date'] ?? null;
    $stories = $body['stories'] ?? [];

    if (!$date) {
        Auth::jsonError(400, '缺少 date 字段');
    }

    // stories 为空数组 = 用户删除了该日全部故事，清空服务端记录
    if (empty($stories)) {
        $delAllStmt = $db->prepare('DELETE FROM stories WHERE user_id = ? AND story_date = ?');
        $delAllStmt->execute([$userId, $date]);

        Auth::jsonSuccess([
            'saved'       => [],
            'conflicts'   => [],
            'cleared'     => true,
            'server_time' => nowISO8601()
        ]);
    }

    // 验证日期格式
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        Auth::jsonError(400, '日期格式应为 YYYY-MM-DD');
    }

    $saved = [];
    $conflicts = [];
    $now = date('Y-m-d H:i:s');
    $maxIndexSent = 0;

    $upsertStmt = $db->prepare(
        'INSERT INTO stories (user_id, story_date, story_index, title, content, value_dim, completed, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
             title     = VALUES(title),
             content   = VALUES(content),
             value_dim = VALUES(value_dim),
             completed = VALUES(completed),
             updated_at = VALUES(updated_at)'
    );

    foreach ($stories as $story) {
        $index = (int) ($story['story_index'] ?? 0);
        if ($index < 1) {
            continue;
        }

        $title   = mb_substr($story['title'] ?? '', 0, 200);
        $content = $story['content'] ?? '';
        $dim     = mb_substr($story['value_dim'] ?? '', 0, 50);
        $done    = !empty($story['completed']) ? 1 : 0;

        // 如果客户端提供了 updated_at，检查冲突
        $clientUpdated = $story['client_updated_at'] ?? null;
        if ($clientUpdated) {
            $check = $db->prepare(
                'SELECT updated_at FROM stories WHERE user_id = ? AND story_date = ? AND story_index = ?'
            );
            $check->execute([$userId, $date, $index]);
            $row = $check->fetch();

            if ($row && $row['updated_at'] > $clientUpdated) {
                $conflicts[] = [
                    'story_date'  => $date,
                    'story_index' => $index,
                    'server_time' => $row['updated_at']
                ];
                continue;
            }
        }

        $upsertStmt->execute([$userId, $date, $index, $title, $content, $dim, $done, $now]);
        $saved[] = ['story_date' => $date, 'story_index' => $index];
        if ($index > $maxIndexSent) $maxIndexSent = $index;
    }

    // 删除不再存在的行（用户删除了某个中间故事，后续索引前移，旧高位索引行残留）
    if ($maxIndexSent > 0) {
        $delStmt = $db->prepare(
            'DELETE FROM stories WHERE user_id = ? AND story_date = ? AND story_index > ?'
        );
        $delStmt->execute([$userId, $date, $maxIndexSent]);
    }

    Auth::jsonSuccess([
        'saved'      => $saved,
        'conflicts'  => $conflicts,
        'server_time' => nowISO8601()
    ]);
}

Auth::jsonError(405, '不支持的请求方法');
