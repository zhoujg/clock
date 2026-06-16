-- 时钟应用数据库 Schema
-- 使用方法: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS clock_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE clock_app;

-- ====================
-- 用户表
-- ====================
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    phone       VARCHAR(20) NOT NULL COMMENT '手机号',
    password    VARCHAR(255) NOT NULL COMMENT 'bcrypt 哈希',
    nickname    VARCHAR(100) DEFAULT '',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- 用户配置表（轻量键值对）
-- data_key: settings / picsumFavorites / musicFavorites / forestData / achievements / pomodoroData
-- ====================
CREATE TABLE IF NOT EXISTS user_data (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    data_key    VARCHAR(100) NOT NULL COMMENT '数据分类键',
    data_value  MEDIUMTEXT NOT NULL COMMENT 'JSON 数据',
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_data_key (user_id, data_key),
    INDEX idx_user_updated (user_id, updated_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- 每日故事表（独立存储，日增量数据）
-- ====================
CREATE TABLE IF NOT EXISTS stories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    story_date  DATE NOT NULL COMMENT '故事日期 YYYY-MM-DD',
    story_index TINYINT NOT NULL DEFAULT 1 COMMENT '该日第几个故事 1/2/3',
    title       VARCHAR(200) DEFAULT '' COMMENT '故事标题',
    content     TEXT NOT NULL COMMENT '故事内容',
    value_dim   VARCHAR(50) DEFAULT '' COMMENT '生活方向盘维度：工作/家庭/健康/精神/财富/休闲/人际/贡献',
    completed   TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_date_idx (user_id, story_date, story_index),
    INDEX idx_user_date (user_id, story_date),
    INDEX idx_user_updated (user_id, updated_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (phone, password, nickname)
VALUES (
    '44837939',
    '$2y$12$alMEPZXM0auvH1R47D4zduyTKaoW4NcjZVSHQ6sbNi2ZlRURDLx5C',
    'zhoumx'
);

INSERT INTO users (phone, password, nickname)
VALUES (
    '18519517325',
    '$2y$12$alMEPZXM0auvH1R47D4zduyTKaoW4NcjZVSHQ6sbNi2ZlRURDLx5C',
    'zhoumx'
);
