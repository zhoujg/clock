<?php
/**
 * 通用助手函数
 */
require_once __DIR__ . '/config.php';

/**
 * 设置 CORS 头
 */
function setCorsHeaders() {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');

    // 处理预检请求
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * 获取 JSON 请求体
 */
function getJsonBody() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

/**
 * 验证手机号格式（支持中国大陆和香港手机号）
 * 支持格式：
 * - 中国大陆：13800138000、+8613800138000
 * - 中国香港：61234567、+85261234567
 */
function isValidPhone($phone) {
    $phone = trim($phone);
    
    // 去掉国码/区号前缀
    $clean = preg_replace('/^\+86/', '', $phone);
    $clean = preg_replace('/^\+852/', '', $clean);
    
    // 中国大陆手机号：11位，以1开头
    if (preg_match('/^1[3-9]\d{9}$/', $clean)) {
        return true;
    }
    
    // 中国香港手机号：8位，以5-9开头（移动电话）
    if (preg_match('/^[5-9]\d{7}$/', $clean)) {
        return true;
    }
    
    return false;
}

/**
 * 获取当前时间（ISO 8601 格式，用于增量同步）
 */
function nowISO8601() {
    return date('c');
}
