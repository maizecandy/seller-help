/**
 * 卖家帮 - 插件 API 服务层
 * 
 * 连接后端 API，实现完整功能
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * 获取认证Token
 */
function getToken() {
  return localStorage.getItem('merchant_token');
}

/**
 * 检查认证状态
 */
async function checkAuth() {
  const token = getToken();
  if (!token) {
    return { authenticated: false, level: 0 };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/merchant/verify?token=${token}`);
    const result = await response.json();
    
    if (result.valid) {
      return { 
        authenticated: true, 
        level: result.merchant.level || 1,
        merchant: result.merchant
      };
    }
    return { authenticated: false, level: 0 };
  } catch (error) {
    console.error('认证检查失败:', error);
    return { authenticated: false, level: 0, error: error.message };
  }
}

/**
 * 1. 文本智能解析
 */
async function parseText(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('文本解析失败:', error);
    // 降级到本地正则解析
    return localParseText(text);
  }
}

/**
 * 2. 图片解析 - 订单截图
 */
async function parseOrderImage(imageUrl) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('订单图片解析失败:', error);
    return null;
  }
}

/**
 * 3. 图片解析 - 聊天截图意图分析
 */
async function analyzeChatIntent(imageUrls) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrls })
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('聊天截图分析失败:', error);
    return null;
  }
}

/**
 * 4. 文件上传
 */
async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      return result;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('文件上传失败:', error);
    return null;
  }
}

/**
 * 5. 风险查询
 */
async function searchRisk(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/risk/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('风险查询失败:', error);
    return { error: error.message, results: [] };
  }
}

/**
 * 6. 提交举报
 */
async function submitReport(reportData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/report/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reportData)
    });
    const result = await response.json();
    if (result.success) {
      return result;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('举报提交失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 7. 店铺产权认证 (Lv2)
 * 通过插件抓取店铺信息，提交到后端验证
 */
async function verifyShopAuth(shopData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/merchant/plugin-auth`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        platform: shopData.platform,
        shopId: shopData.shopId,
        shopName: shopData.shopName,
        mainCategory: shopData.mainCategory,
        openTime: shopData.openTime,
        dsr: shopData.dsr,
        totalRating: shopData.totalRating
      })
    });
    const result = await response.json();
    if (result.success) {
      // 更新本地存储的等级
      if (result.level) {
        localStorage.setItem('merchant_level', result.level);
      }
      return result;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('店铺认证失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 8. 实名认证 (Lv3)
 * 提交营业执照和支付宝信息
 */
async function verifyRealname(realnameData) {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/merchant/realname-auth`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        token: token,
        bizLicense: {
          companyName: realnameData.companyName,
          creditCode: realnameData.creditCode,
          legalPerson: realnameData.legalPerson
        },
        alipay: {
          alipayAccount: realnameData.alipayAccount,
          alipayName: realnameData.alipayName
        }
      })
    });
    const result = await response.json();
    if (result.success) {
      // 更新本地存储的等级
      if (result.level) {
        localStorage.setItem('merchant_level', result.level);
      }
      return result;
    }
    throw new Error(result.error);
  } catch (error) {
    console.error('实名认证失败:', error);
    return { success: false, error: error.message };
  }
}

// ============ 本地降级解析 ============

function localParseText(text) {
  const result = {
    name: null,
    phone: null,
    phoneExt: null,
    province: null,
    city: null,
    district: null,
    address: null,
    platform: null,
    logisticsCode: null
  };
  
  // 手机号
  const phoneMatch = text.match(/(?:1[3-9]\d[\s\-*]?\d{4}[\s\-*]?\d{4})|(?:\+\d{1,3}[\s\-]?1[3-9]\d[\s\-*]?\d{4}[\s\-*]?\d{4})/);
  if (phoneMatch) result.phone = phoneMatch[0].replace(/[\s\-]/g, '*');
  
  // 分机号
  const extMatch = text.match(/(?:转[#\:]\s*|分机[码:]?\s*|ext[\.:]?\s*)(\d{3,6})/i);
  if (extMatch) result.phoneExt = extMatch[1];
  
  // 姓名
  const nameMatch = text.match(/[\u4e00-\u9fa5]{1,3}[*\s]?[\u4e00-\u9fa5]/);
  if (nameMatch) result.name = nameMatch[0].replace(/\s/g, '*');
  
  // 省市区
  const provinceMatch = text.match(/([^\s]+?(?:省|自治区))/);
  const cityMatch = text.match(/([^\s]+?(?:市|自治州|地区|盟))/);
  const districtMatch = text.match(/([^\s]+?(?:区|县|旗|市))/);
  if (provinceMatch) result.province = provinceMatch[1];
  if (cityMatch) result.city = cityMatch[1];
  if (districtMatch) result.district = districtMatch[1];
  
  // 物流单号
  const logMatch = text.match(/(?:物流|运单|快递)[\s:：]?\s*([A-Z0-9]{10,15})/i) 
    || text.match(/\b([A-Z]{2}\d{9,13}[A-Z]{0,2})\b/);
  if (logMatch) result.logisticsCode = logMatch[1];
  
  // 平台
  if (text.includes('淘宝') || text.includes('天猫')) result.platform = '淘宝/天猫';
  else if (text.includes('拼多多')) result.platform = '拼多多';
  else if (text.includes('抖音')) result.platform = '抖音';
  else if (text.includes('京东')) result.platform = '京东';
  
  return result;
}

// 导出
window.API = {
  // 认证
  checkAuth,
  getToken,
  
  // 解析
  parseText,
  parseOrderImage,
  analyzeChatIntent,
  uploadFile,
  
  // 风险
  searchRisk,
  submitReport,
  
  // 认证
  verifyShopAuth,
  verifyRealname
};
