-- 卖家帮反欺诈平台 - MySQL 数据库初始化脚本
-- 创建数据库

CREATE DATABASE IF NOT EXISTS seller_help 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE seller_help;

-- ==================== 商户表 ====================
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(32) PRIMARY KEY COMMENT '商户ID',
    shop_name VARCHAR(255) NOT NULL COMMENT '店铺名称',
    contact_name VARCHAR(100) COMMENT '联系人姓名',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
    email VARCHAR(255) COMMENT '邮箱',
    platforms JSON COMMENT '运营平台 ["taobao","pinduoduo"]',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '状态',
    level TINYINT DEFAULT 1 COMMENT '认证等级: 1-访客, 2-初级卖家, 3-认证卖家',
    token VARCHAR(255) COMMENT '登录Token',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    approved_at TIMESTAMP NULL COMMENT '审核通过时间',
    approved_by VARCHAR(50) COMMENT '审核人',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    upgraded_at TIMESTAMP NULL COMMENT '升级时间',
    
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_level (level),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商户表';

-- ==================== 商户实名认证信息 ====================
CREATE TABLE IF NOT EXISTS merchant_realname (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id VARCHAR(32) NOT NULL COMMENT '商户ID',
    company_name VARCHAR(255) COMMENT '企业名称',
    credit_code VARCHAR(18) COMMENT '统一社会信用代码',
    legal_person VARCHAR(50) COMMENT '法人姓名',
    alipay_account VARCHAR(100) COMMENT '支付宝账号',
    alipay_name VARCHAR(50) COMMENT '支付宝实名',
    realname_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '实名状态',
    realname_note TEXT COMMENT '备注',
    verified_at TIMESTAMP NULL COMMENT '认证时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_merchant (merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商户实名认证信息';

-- ==================== 风险记录表 ====================
CREATE TABLE IF NOT EXISTS risk_records (
    id VARCHAR(32) PRIMARY KEY COMMENT '记录ID',
    buyer_hash VARCHAR(64) NOT NULL COMMENT '买家Hash指纹',
    buyer_name VARCHAR(50) COMMENT '脱敏姓名',
    phone_hash VARCHAR(64) COMMENT '手机号Hash',
    phone_ext VARCHAR(10) COMMENT '分机号',
    province VARCHAR(20) COMMENT '省份',
    city VARCHAR(20) COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    address_hash VARCHAR(64) COMMENT '地址Hash',
    logistics_hash VARCHAR(64) COMMENT '物流指纹',
    platform VARCHAR(20) COMMENT '平台',
    risk_type ENUM('only_refund', 'return_scam', 'blackmail', 'fake_review', 'normal') DEFAULT 'normal' COMMENT '风险类型',
    risk_score INT DEFAULT 0 COMMENT '风险评分 0-100',
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low' COMMENT '风险等级',
    report_count INT DEFAULT 1 COMMENT '被举报次数',
    evidence_types JSON COMMENT '证据类型 ["text","image","video"]',
    first_report_at TIMESTAMP NULL COMMENT '首次举报时间',
    last_report_at TIMESTAMP NULL COMMENT '最后举报时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_buyer_hash (buyer_hash),
    INDEX idx_phone_hash (phone_hash),
    INDEX idx_address_hash (address_hash),
    INDEX idx_logistics_hash (logistics_hash),
    INDEX idx_risk_level (risk_level),
    INDEX idx_risk_type (risk_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险记录表';

-- ==================== 举报记录表 ====================
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(32) PRIMARY KEY COMMENT '举报ID',
    merchant_id VARCHAR(32) NOT NULL COMMENT '举报商户ID',
    platform VARCHAR(20) NOT NULL COMMENT '平台',
    order_id VARCHAR(50) COMMENT '订单号',
    risk_type VARCHAR(30) NOT NULL COMMENT '风险类型',
    description TEXT COMMENT '描述',
    status ENUM('pending', 'approved', 'rejected', 'appealed') DEFAULT 'pending' COMMENT '状态',
    confidence_score INT DEFAULT 0 COMMENT '置信度',
    evidence_order VARCHAR(255) COMMENT '订单截图URL',
    evidence_refund VARCHAR(255) COMMENT '退款截图URL',
    evidence_chat TEXT COMMENT '聊天截图URLs(JSON)',
    evidence_physical TEXT COMMENT '物理凭证URLs(JSON)',
    ai_analysis TEXT COMMENT 'AI分析结果',
    credit_weight DECIMAL(3,2) DEFAULT 1.00 COMMENT '信用权重',
    reward_points INT DEFAULT 0 COMMENT '奖励积分',
    reviewer_id VARCHAR(32) COMMENT '审核人ID',
    reviewed_at TIMESTAMP NULL COMMENT '审核时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    INDEX idx_merchant (merchant_id),
    INDEX idx_status (status),
    INDEX idx_platform (platform),
    INDEX idx_risk_type (risk_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报记录表';

-- ==================== 上传文件表 ====================
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(32) PRIMARY KEY,
    merchant_id VARCHAR(32) COMMENT '上传商户ID',
    report_id VARCHAR(32) COMMENT '关联举报ID',
    file_type ENUM('order', 'refund', 'chat', 'evidence', 'other') DEFAULT 'other' COMMENT '文件类型',
    original_name VARCHAR(255) COMMENT '原始文件名',
    stored_path VARCHAR(500) COMMENT '存储路径',
    file_size BIGINT COMMENT '文件大小',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    file_hash VARCHAR(64) COMMENT '文件Hash',
    is_parsed TINYINT DEFAULT 0 COMMENT '是否已解析',
    parse_result TEXT COMMENT '解析结果',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
    INDEX idx_merchant (merchant_id),
    INDEX idx_report (report_id),
    INDEX idx_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件表';

-- ==================== 风险查询日志 ====================
CREATE TABLE IF NOT EXISTS risk_search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id VARCHAR(32) COMMENT '查询商户ID',
    search_type ENUM('phone', 'phone_ext', 'address', 'logistics', 'fuzzy') DEFAULT 'phone' COMMENT '查询类型',
    search_keyword VARCHAR(255) COMMENT '搜索关键词(脱敏)',
    result_count INT DEFAULT 0 COMMENT '命中结果数',
    risk_found TINYINT DEFAULT 0 COMMENT '是否发现风险',
    result_level ENUM('low', 'medium', 'high', 'critical') COMMENT '结果风险等级',
    query_time_ms INT COMMENT '查询耗时(毫秒)',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT 'User Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    INDEX idx_merchant (merchant_id),
    INDEX idx_search_type (search_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险查询日志';

-- ==================== 商户操作日志 ====================
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id VARCHAR(32) COMMENT '操作商户ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_desc TEXT COMMENT '操作描述',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT 'User Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    INDEX idx_merchant (merchant_id),
    INDEX idx_type (operation_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志';

-- 插入测试数据
INSERT INTO merchants (id, shop_name, contact_name, phone, platforms, password, status, level) VALUES
('mch_test001', '测试店铺', '张三', '13900000001', '["taobao","pinduoduo]', '$2a$10$XQxBtJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJe', 'approved', 3),
('mch_test002', '示例旗舰店', '李四', '13900000002', '["taobao"]', '$2a$10$XQxBtJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJ0aHjJe', 'approved', 2);

-- 插入示例风险记录
INSERT INTO risk_records (id, buyer_hash, buyer_name, phone_hash, province, city, risk_type, risk_score, risk_level, report_count) VALUES
('risk_001', 'hash_xxx', '张*', 'phone_hash_xxx', '广东', '广州', 'only_refund', 85, 'high', 3),
('risk_002', 'hash_yyy', '王*', 'phone_hash_yyy', '浙江', '杭州', 'return_scam', 95, 'critical', 5);
