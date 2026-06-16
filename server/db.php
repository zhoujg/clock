<?php
/**
 * 数据库连接模块
 */
require_once __DIR__ . '/config.php';

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        // 自动检测 MAMP MySQL（端口 8889，socket 路径不同）
        $mampSocket = '/Applications/MAMP/tmp/mysql/mysql.sock';
        $host = DB_HOST;
        $port = DB_PORT;

        if (file_exists($mampSocket)) {
            // MAMP 环境：使用 TCP 127.0.0.1:8889（避开 Unix socket 权限问题）
            $dsn = sprintf(
                'mysql:host=127.0.0.1;port=8889;dbname=%s;charset=%s',
                DB_NAME, DB_CHARSET
            );
            $user = 'root';
            $pass = 'root';
        } else {
            // 标准环境：localhost 改为 127.0.0.1（避免 Unix socket 路径问题）
            if ($host === 'localhost') {
                $host = '127.0.0.1';
            }
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $host, $port, DB_NAME, DB_CHARSET
            );
            $user = DB_USER;
            $pass = DB_PASS;
        }

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES    => false,
        ];

        $this->pdo = new PDO($dsn, $user, $pass, $options);
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }
}
