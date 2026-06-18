<?php
/**
 * 更新用户昵称 API
 * POST /api/update_nickname.php
 * Header: Authorization: Bearer <token>
 * Body: { "nickname": "新昵称" }
 */
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Auth::jsonError(405, '仅支持 POST 请求');
}

// 验证 Token
$payload = Auth::requireAuth();
$userId = $payload['sub'] ?? 0;

$data = getJsonBody();
$nickname = trim($data['nickname'] ?? '');

if ($nickname === '') {
    Auth::jsonError(400, '昵称不能为空');
}

if (mb_strlen($nickname) > 20) {
    Auth::jsonError(400, '昵称不能超过 20 个字符');
}

// 更新数据库
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare('UPDATE users SET nickname = ? WHERE id = ?');
$stmt->execute([$nickname, $userId]);

if ($stmt->rowCount() === 0) {
    Auth::jsonError(404, '用户不存在');
}

Auth::jsonSuccess([
    'nickname' => $nickname
]);
