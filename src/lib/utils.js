/**
 * 卖家帮 - 通用工具函数
 */

/**
 * 脱敏手机号
 * 13812345678 -> 138****1234
 */
export function maskPhone(phone) {
  if (!phone) return null;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏姓名
 * 张三 -> 张*
 */
export function maskName(name) {
  if (!name) return null;
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

/**
 * 脱敏地址
 * 保留省市区，详细地址脱敏
 */
export function maskAddress(address) {
  if (!address) return null;
  // 简单处理：保留前10个字符
  if (address.length > 10) {
    return address.substring(0, 10) + '***';
  }
  return address;
}

/**
 * 生成买家 ID
 */
export function generateBuyerId(phone) {
  if (!phone) return `buyer_${Date.now()}`;
  const hash = phone.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `buyer_${Math.abs(hash).toString(36)}`;
}

/**
 * 计算风险等级
 */
export function getRiskLevel(score) {
  if (score > 80) return { level: 'critical', label: '极高危', color: 'red' };
  if (score > 60) return { level: 'high', label: '高风险', color: 'orange' };
  if (score > 30) return { level: 'medium', label: '中风险', color: 'yellow' };
  return { level: 'low', label: '低风险', color: 'green' };
}

/**
 * 风险类型标签
 */
export const riskTypeLabels = {
  'refund': '退货退款',
  'only_refund': '恶意仅退款',
  'return_scam': '退货调包',
  'blackmail': '敲诈勒索',
  'fake_review': '职业差评'
};

/**
 * 平台标签
 */
export const platformLabels = {
  'taobao': '淘宝/天猫',
  'pinduoduo': '拼多多',
  'douyin': '抖音',
  'jd': '京东',
  'other': '其他'
};

/**
 * 格式化日期
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 验证手机号
 */
export function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证邮箱
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 分页处理
 */
export function paginate(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit)
    }
  };
}
