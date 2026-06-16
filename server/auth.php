<?php
/**
 * JWT 认证模块（纯 PHP 实现，无外部依赖）
 */
require_once __DIR__ . '/config.php';

class Auth {
    /**
     * 生成 JWT Token
     */
    public static function generateToken($userId, $phone) {
        $header = self::base64UrlEncode(json_encode([
            'alg' => JWT_ALGORITHM,
            'typ' => 'JWT'
        ]));

        $payload = self::base64UrlEncode(json_encode([
            'sub'   => $userId,
            'phone' => $phone,
            'iat'   => time(),
            'exp'   => time() + JWT_EXPIRE
        ]));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );

        return "$header.$payload.$signature";
    }

    /**
     * 验证并解析 JWT Token，返回 payload 或 false
     */
    public static function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        [$header, $payload, $signature] = $parts;

        // 验证签名
        $validSig = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );

        if (!hash_equals($validSig, $signature)) {
            return false;
        }

        // 解析 payload
        $data = json_decode(self::base64UrlDecode($payload), true);
        if (!$data) {
            return false;
        }

        // 检查过期
        if (isset($data['exp']) && $data['exp'] < time()) {
            return false;
        }

        return $data;
    }

    /**
     * 从请求头提取并验证 Token，返回用户信息或终止请求
     */
    public static function requireAuth() {
        $token = self::extractToken();
        if (!$token) {
            self::jsonError(401, '未提供认证信息');
        }

        $payload = self::verifyToken($token);
        if (!$payload) {
            self::jsonError(401, '认证信息无效或已过期');
        }

        return $payload;
    }

    /**
     * 从 Authorization 头提取 Token
     */
    public static function extractToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * 检查密码
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    /**
     * 哈希密码
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * 输出 JSON 错误并终止
     */
    public static function jsonError($code, $message) {
        http_response_code($code);
        echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * 输出 JSON 成功响应
     */
    public static function jsonSuccess($data = [], $code = 200) {
        http_response_code($code);
        echo json_encode(array_merge(['success' => true], $data), JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ---- 内部辅助方法 ----

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
