<?php
/**
 * 用户注册 API
 * POST /api/register.php
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
$nickname = trim($data['nickname'] ?? '');

// 验证输入
if (!isValidPhone($phone)) {
    Auth::jsonError(400, '请输入有效的手机号');
}

if (strlen($password) < 6) {
    Auth::jsonError(400, '密码至少需要 6 个字符');
}

if (strlen($password) > 128) {
    Auth::jsonError(400, '密码过长');
}

// 检查手机号是否已注册（统一存储为纯数字格式）
$cleanPhone = preg_replace('/^\+86/', '', $phone);
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare('SELECT id FROM users WHERE phone = ?');
$stmt->execute([$cleanPhone]);

if ($stmt->fetch()) {
    Auth::jsonError(409, '该手机号已被注册');
}

// 创建用户
$hash = Auth::hashPassword($password);
$stmt = $db->prepare('INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)');
$stmt->execute([$cleanPhone, $hash, $nickname]);
$userId = (int) $db->lastInsertId();

// 生成 Token
$token = Auth::generateToken($userId, $cleanPhone);

// 初始化空的用户数据记录
$keys = ['settings', 'picsumFavorites', 'musicFavorites', 'forestData', 'achievements', 'pomodoroData'];
$stmt = $db->prepare('INSERT IGNORE INTO user_data (user_id, data_key, data_value) VALUES (?, ?, ?)');
foreach ($keys as $key) {
    $stmt->execute([$userId, $key, '{}']);
}

Auth::jsonSuccess([
    'token'    => $token,
    'user'     => [
        'id'       => $userId,
        'phone'    => $cleanPhone,
        'nickname' => $nickname
    ]
], 201);
