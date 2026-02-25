/**
 * 卖家帮 - 数据库模块
 * 支持 MySQL (生产) / JSON (开发)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'seller_help',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

// JSON 文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');

// 初始化数据库连接
async function initDB() {
  try {
    pool = mysql.createPool(DB_CONFIG);
    
    // 测试连接
    const connection = await pool.getConnection();
    console.log('✅ MySQL 数据库连接成功');
    connection.release();
    
    return true;
  } catch (error) {
    console.log('⚠️ MySQL 连接失败，将使用 JSON 文件存储');
    console.log('错误:', error.message);
    pool = null;
    return false;
  }
}

// 判断是否使用 MySQL
function isMySQL() {
  return pool !== null;
}

// 获取连接
async function getConnection() {
  if (pool) {
    return pool.getConnection();
  }
  throw new Error('数据库未初始化');
}

// ============ 商户操作 ============

// 查询所有商户
async function getMerchants(options = {}) {
  if (isMySQL()) {
    const { status, level, limit = 100, offset = 0 } = options;
    let sql = 'SELECT * FROM merchants WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (level) {
      sql += ' AND level >= ?';
      params.push(level);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else {
    // JSON 降级
    const data = readJSON('merchants.json');
    let result = data;
    
    if (options.status) {
      result = result.filter(m => m.status === options.status);
    }
    if (options.level) {
      result = result.filter(m => (m.level || 1) >= options.level);
    }
    
    return result.slice(offset, offset + limit);
  }
}

// 根据手机号查询商户
async function getMerchantByPhone(phone) {
  if (isMySQL()) {
    const [rows] = await pool.execute(
      'SELECT * FROM merchants WHERE phone = ?',
      [phone]
    );
    return rows[0] || null;
  } else {
    const data = readJSON('merchants.json');
    return data.find(m => m.phone === phone) || null;
  }
}

// 根据ID查询商户
async function getMerchantById(id) {
  if (isMySQL()) {
    const [rows] = await pool.execute(
      'SELECT * FROM merchants WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } else {
    const data = readJSON('merchants.json');
    return data.find(m => m.id === id) || null;
  }
}

// 根据Token查询商户
async function getMerchantByToken(token) {
  if (isMySQL()) {
    const [rows] = await pool.execute(
      'SELECT * FROM merchants WHERE token = ?',
      [token]
    );
    return rows[0] || null;
  } else {
    const data = readJSON('merchants.json');
    return data.find(m => m.token === token) || null;
  }
}

// 创建商户
async function createMerchant(merchant) {
  const id = 'mch_' + Date.now();
  const now = new Date().toISOString();
  
  if (isMySQL()) {
    await pool.execute(
      `INSERT INTO merchants (id, shop_name, contact_name, phone, email, platforms, password, status, level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?, ?)`,
      [
        id,
        merchant.shopName,
        merchant.contactName,
        merchant.phone,
        merchant.email || '',
        JSON.stringify(merchant.platforms || []),
        merchant.password,
        now,
        now
      ]
    );
    return { id, ...merchant };
  } else {
    const data = readJSON('merchants.json');
    const newMerchant = {
      id,
      ...merchant,
      status: 'approved',
      level: 1,
      createdAt: now,
      updatedAt: now
    };
    data.push(newMerchant);
    writeJSON('merchants.json', data);
    return newMerchant;
  }
}

// 更新商户
async function updateMerchant(id, updates) {
  const now = new Date().toISOString();
  
  if (isMySQL()) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    await pool.execute(
      `UPDATE merchants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  } else {
    const data = readJSON('merchants.json');
    const index = data.findIndex(m => m.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updatedAt: now };
      writeJSON('merchants.json', data);
    }
  }
  
  return getMerchantById(id);
}

// ============ 风险记录操作 ============

// 查询风险记录
async function searchRiskRecords(conditions = {}) {
  if (isMySQL()) {
    let sql = 'SELECT * FROM risk_records WHERE 1=1';
    const params = [];
    
    if (conditions.phoneHash) {
      sql += ' AND phone_hash = ?';
      params.push(conditions.phoneHash);
    }
    if (conditions.phoneExt) {
      sql += ' AND phone_ext = ?';
      params.push(conditions.phoneExt);
    }
    if (conditions.province) {
      sql += ' AND province = ?';
      params.push(conditions.province);
    }
    if (conditions.city) {
      sql += ' AND city = ?';
      params.push(conditions.city);
    }
    if (conditions.addressHash) {
      sql += ' AND address_hash = ?';
      params.push(conditions.addressHash);
    }
    
    sql += ' ORDER BY risk_score DESC LIMIT 50';
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else {
    const data = readJSON('risk.json');
    // 简化版查询
    return data.slice(0, 10);
  }
}

// 创建风险记录
async function createRiskRecord(record) {
  const id = 'risk_' + Date.now();
  
  if (isMySQL()) {
    await pool.execute(
      `INSERT INTO risk_records (id, buyer_hash, buyer_name, phone_hash, phone_ext, province, city, district, platform, risk_type, risk_score, risk_level, report_count, first_report_at, last_report_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.buyerHash,
        record.buyerName,
        record.phoneHash,
        record.phoneExt,
        record.province,
        record.city,
        record.district,
        record.platform,
        record.riskType || 'normal',
        record.riskScore || 0,
        record.riskLevel || 'low',
        record.reportCount || 1,
        new Date(),
        new Date(),
        new Date()
      ]
    );
  } else {
    const data = readJSON('risk.json');
    data.push({
      id,
      ...record,
      createdAt: new Date().toISOString()
    });
    writeJSON('risk.json', data);
  }
  
  return { id, ...record };
}

// ============ 举报记录操作 ============

// 创建举报
async function createReport(report) {
  const id = 'rpt_' + Date.now();
  const now = new Date().toISOString();
  
  if (isMySQL()) {
    await pool.execute(
      `INSERT INTO reports (id, merchant_id, platform, order_id, risk_type, description, status, confidence_score, evidence_chat, evidence_physical, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        id,
        report.merchantId,
        report.platform,
        report.orderId,
        report.riskType,
        report.description,
        report.confidenceScore || 0,
        JSON.stringify(report.evidenceChat || []),
        JSON.stringify(report.evidencePhysical || []),
        now
      ]
    );
  } else {
    const data = readJSON('reports.json');
    data.push({
      id,
      ...report,
      status: 'pending',
      createdAt: now
    });
    writeJSON('reports.json', data);
  }
  
  return { id, ...report };
}

// 查询举报
async function getReports(conditions = {}) {
  if (isMySQL()) {
    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    
    if (conditions.merchantId) {
      sql += ' AND merchant_id = ?';
      params.push(conditions.merchantId);
    }
    if (conditions.status) {
      sql += ' AND status = ?';
      params.push(conditions.status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else {
    const data = readJSON('reports.json');
    let result = data;
    
    if (conditions.merchantId) {
      result = result.filter(r => r.merchantId === conditions.merchantId);
    }
    if (conditions.status) {
      result = result.filter(r => r.status === conditions.status);
    }
    
    return result;
  }
}

// ============ 工具函数 ============

function readJSON(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    }
  } catch (e) {
    console.error(`读取 ${filename} 失败:`, e);
  }
  return [];
}

function writeJSON(filename, data) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`写入 ${filename} 失败:`, e);
  }
}

// 导出
module.exports = {
  initDB,
  isMySQL,
  getMerchants,
  getMerchantByPhone,
  getMerchantById,
  getMerchantByToken,
  createMerchant,
  updateMerchant,
  searchRiskRecords,
  createRiskRecord,
  createReport,
  getReports
};
