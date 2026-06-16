<?php
/**
 * 用户登录 API
 * POST /api/login.php
 * Body: { "phone": "13800138000", "password": "mypassword" }
 */
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Auth::jsonError(405, '仅支持 POST 请求');
}

$data = getJsonBody();
$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';

if (empty($phone) || empty($password)) {
    Auth::jsonError(400, '请输入手机号和密码');
}

// 统一格式：去掉 +86 前缀
$cleanPhone = preg_replace('/^\+86/', '', $phone);

// 查找用户
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare('SELECT id, phone, password, nickname FROM users WHERE phone = ?');
$stmt->execute([$cleanPhone]);
$user = $stmt->fetch();

if (!$user || !Auth::verifyPassword($password, $user['password'])) {
    Auth::jsonError(401, '手机号或密码错误');
}

// 生成 Token
$token = Auth::generateToken($user['id'], $user['phone']);

Auth::jsonSuccess([
    'token' => $token,
    'user'  => [
        'id'       => (int) $user['id'],
        'phone'    => $user['phone'],
        'nickname' => $user['nickname']
    ]
]);
