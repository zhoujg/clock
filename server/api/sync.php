<?php
/**
 * 用户数据同步 API
 * 
 * GET  /api/sync.php?keys=settings,picsumFavorites   → 拉取指定 key 的数据
 * GET  /api/sync.php?since=2026-06-15T12:00:00+08:00 → 增量拉取（按更新时间）
 * POST /api/sync.php                                  → 推送本地数据到云端
 * Body: { "data": { "settings": {...}, "picsumFavorites": [...] } }
 *
 * 冲突策略：last-write-wins（以后端时间戳为准）。前端推送数据时，若云端
 * updated_at 比本地更新的更晚，说明其他设备已更新，返回云端版本供前端确认。
 */
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

setCorsHeaders();

$user = Auth::requireAuth();
$userId = $user['sub'];
$db = Database::getInstance()->getConnection();

// ====================
// GET: 拉取数据
// ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $keys = isset($_GET['keys']) ? explode(',', $_GET['keys']) : null;
    $since = $_GET['since'] ?? null;

    // 增量模式：只返回指定时间之后更新的数据
    if ($since) {
        $stmt = $db->prepare(
            'SELECT data_key, data_value, updated_at FROM user_data WHERE user_id = ? AND updated_at > ?'
        );
        $stmt->execute([$userId, $since]);
    }
    // 全量拉取（按 keys 过滤）
    elseif ($keys) {
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $stmt = $db->prepare(
            "SELECT data_key, data_value, updated_at FROM user_data WHERE user_id = ? AND data_key IN ($placeholders)"
        );
        $params = array_merge([$userId], $keys);
        $stmt->execute($params);
    }
    // 全量拉取所有数据
    else {
        $stmt = $db->prepare(
            'SELECT data_key, data_value, updated_at FROM user_data WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
    }

    $rows = $stmt->fetchAll();
    $data = [];
    $timestamps = [];

    foreach ($rows as $row) {
        $data[$row['data_key']] = json_decode($row['data_value'], true);
        $timestamps[$row['data_key']] = $row['updated_at'];
    }

    Auth::jsonSuccess([
        'data'       => $data,
        'timestamps' => $timestamps,
        'server_time' => nowISO8601()
    ]);
}

// ====================
// POST: 推送数据
// ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    $inputData = $body['data'] ?? [];

    if (empty($inputData)) {
        Auth::jsonError(400, '缺少 data 字段');
    }

    $conflicts = [];   // 冲突的数据 key
    $saved = [];       // 成功保存的 key
    $now = date('Y-m-d H:i:s');
    $validKeys = ['settings', 'picsumFavorites', 'musicFavorites', 'forestData', 'achievements', 'pomodoroData'];

    foreach ($inputData as $key => $value) {
        if (!in_array($key, $validKeys, true)) {
            continue;
        }

        $newValue = json_encode($value, JSON_UNESCAPED_UNICODE);

        // 先查询当前云端版本
        $stmt = $db->prepare(
            'SELECT data_value, updated_at FROM user_data WHERE user_id = ? AND data_key = ?'
        );
        $stmt->execute([$userId, $key]);
        $row = $stmt->fetch();

        // 客户端提供的本地时间戳
        $clientUpdatedAt = $body['client_timestamps'][$key] ?? null;

        // 如果云端有更新的版本，标记冲突
        if ($row && $clientUpdatedAt && $row['updated_at'] > $clientUpdatedAt) {
            $conflicts[$key] = json_decode($row['data_value'], true);
            continue;
        }

        // 保存或更新
        $stmt = $db->prepare(
            'INSERT INTO user_data (user_id, data_key, data_value, updated_at)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE data_value = VALUES(data_value), updated_at = VALUES(updated_at)'
        );
        $stmt->execute([$userId, $key, $newValue, $now]);
        $saved[] = $key;
    }

    Auth::jsonSuccess([
        'saved'     => $saved,
        'conflicts' => $conflicts,
        'server_time' => nowISO8601()
    ]);
}

Auth::jsonError(405, '不支持的请求方法');
