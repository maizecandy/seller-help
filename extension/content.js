// Content Script - 注入到电商平台页面
// 实现 DOM 抓取，用于店铺认证和订单信息提取

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchOrderInfo') {
    const info = fetchOrderInfo();
    sendResponse(info);
  }
  
  if (request.action === 'getShopInfo') {
    const info = getShopInfo();
    sendResponse(info);
  }
  
  if (request.action === 'showRiskBadge') {
    showRiskBadge(request.data);
    sendResponse({ success: true });
  }
});

// 从页面提取店铺信息（用于插件认证）
function getShopInfo() {
  const url = window.location.href;
  const urlLower = url.toLowerCase();
  
  let platform = null;
  let shopName = null;
  let shopId = null;
  let mainCategory = null;
  let openTime = 0; // 开店天数
  let dsr = null;
  let totalReviews = 0;
  let isNewShop = true;
  
  // ========== 淘宝/天猫商家后台 ==========
  if (urlLower.includes('myseller.taobao') || urlLower.includes('sell.taobao') || 
      urlLower.includes('shopmanager') || urlLower.includes('service.alibaba')) {
    platform = 'taobao';
    
    // 店铺名称 - 尝试多种选择器
    shopName = extractText([
      '.shop-name', '.shopName', '[class*="shop-name"]', 
      '.seller-header .shop-name', '.top-shop-name',
      '#shopName', '[data-spm="shopName"]'
    ]);
    
    // 店铺ID
    shopId = extractValue([
      '[data-shopid]', '[data-shop-id]', '[shopid]',
      '[class*="shop-id"]', '#shopId'
    ]);
    
    // 主营类目
    mainCategory = extractText([
      '[class*="category"]', '[class*="main-business"]',
      '.business-scope', '#mainCategory'
    ]);
    
    // DSR 评分
    const dsrEl = document.querySelector('[class*="dsr"]') || 
                  document.querySelector('.shop-score') ||
                  document.querySelector('[data-spm="dsr"]');
    if (dsrEl) {
      const dsrText = dsrEl.textContent;
      const dsrMatch = dsrText.match(/(\d+\.?\d*)/);
      if (dsrMatch) dsr = parseFloat(dsrMatch[1]);
    }
    
    // 开店时长 - 从店铺信息中提取
    const openTimeText = extractText([
      '[class*="open-time"]', '[class*="openDate"]',
      '.shop-age', '#openTime'
    ]);
    if (openTimeText) {
      const dayMatch = openTimeText.match(/(\d+)\s*天/);
      const yearMatch = openTimeText.match(/(\d+)\s*年/);
      if (dayMatch) openTime = parseInt(dayMatch[1]);
      else if (yearMatch) openTime = parseInt(yearMatch[1]) * 365;
    } else {
      // 默认值，实际应该从页面抓取
      openTime = 365;
    }
    
    // 累计评价数
    const reviewsText = extractText([
      '[class*="total-review"]', '[class*="review-count"]',
      '.evaluation-count', '#totalReviews'
    ]);
    if (reviewsText) {
      const reviewMatch = reviewsText.match(/(\d+)/);
      if (reviewMatch) totalReviews = parseInt(reviewMatch[1]);
    }
    
    isNewShop = openTime < 90; // 90天内算新店
  }
  
  // ========== 拼多多商家后台 ==========
  else if (urlLower.includes('erp.pinduoduo') || urlLower.includes('merchant.pinduoduo') ||
           urlLower.includes('mms.pinduoduo')) {
    platform = 'pinduoduo';
    
    shopName = extractText([
      '.shop-name', '[class*="shop-name"]', 
      '.merchant-name', '#shopName'
    ]);
    
    shopId = extractValue([
      '[data-shop-id]', '[shop-id]', '#shopId'
    ]);
    
    mainCategory = extractText([
      '[class*="category"]', '.goods-category'
    ]);
    
    // 店铺评分
    const scoreEl = document.querySelector('[class*="score"]') ||
                    document.querySelector('.shop-score');
    if (scoreEl) {
      const scoreText = scoreEl.textContent;
      const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
      if (scoreMatch) dsr = parseFloat(scoreMatch[1]);
    }
    
    openTime = 180; // 默认值
    isNewShop = openTime < 90;
  }
  
  // ========== 抖音商家后台 ==========
  else if (urlLower.includes('partner.douyin') || urlLower.includes('shop.douyin') ||
           urlLower.includes('ecom.douyin')) {
    platform = 'douyin';
    
    shopName = extractText([
      '.shop-name', '[class*="shop-name"]',
      '.store-name', '#shopName'
    ]);
    
    shopId = extractValue([
      '[data-shop-id]', '[shop-id]'
    ]);
    
    mainCategory = extractText([
      '[class*="category"]', '.category-name'
    ]);
    
    // 商家体验分
    const expEl = document.querySelector('[class*="experience"]') ||
                  document.querySelector('.shop-exp');
    if (expEl) {
      const expText = expEl.textContent;
      const expMatch = expText.match(/(\d+\.?\d*)/);
      if (expMatch) dsr = parseFloat(expMatch[1]);
    }
    
    openTime = 400;
    isNewShop = openTime < 90;
  }
  
  // ========== 京东商家后台 ==========
  else if (urlLower.includes('jshop.jd') || urlLower.includes('pop.jd') ||
           urlLower.includes('shop.jd')) {
    platform = 'jd';
    
    shopName = extractText([
      '.shop-name', '[class*="shop-name"]',
      '.store-name', '#shopName'
    ]);
    
    shopId = extractValue([
      '[data-shop-id]', '[shop-id]'
    ]);
    
    mainCategory = extractText([
      '[class*="category"]', '.category-info'
    ]);
    
    // 店铺评分
    const jdScoreEl = document.querySelector('[class*="score"]');
    if (jdScoreEl) {
      const jdScoreText = jdScoreEl.textContent;
      const jdScoreMatch = jdScoreText.match(/(\d+\.?\d*)/);
      if (jdScoreMatch) dsr = parseFloat(jdScoreMatch[1]);
    }
    
    openTime = 500;
    isNewShop = openTime < 90;
  }
  
  // 如果没有提取到店铺名，返回平台未知
  if (!shopName) {
    return {
      platform: 'unknown',
      shopName: null,
      shopId: null,
      mainCategory: null,
      openTime: 0,
      dsr: null,
      totalReviews: 0,
      isNewShop: true,
      error: '无法识别当前页面，请确保在商家后台页面点击认证'
    };
  }
  
  return {
    platform,
    shopName: shopName.trim(),
    shopId: shopId || generateShopId(platform, shopName),
    mainCategory: mainCategory || '未知',
    openTime,
    dsr: dsr || 4.5,
    totalReviews,
    isNewShop,
    capturedAt: new Date().toISOString()
  };
}

// 从页面提取订单信息 - 增强版
function fetchOrderInfo() {
  let name = null;
  let phone = null;
  let phoneExt = null;  // 分机号
  let address = null;
  let platform = null;
  let orderId = null;
  let logisticsCode = null; // 物流单号
  
  const url = window.location.href;
  const urlLower = url.toLowerCase();
  
  // ========== 淘宝/天猫 ==========
  if (urlLower.includes('taobao.com') || urlLower.includes('tmall.com') || 
      urlLower.includes('tmall.hk')) {
    platform = '淘宝/天猫';
    
    name = extractText([
      '.receiver-name', '.buyer-name', '[data-spm-id="receiverName"]', 
      '#consigneeName', '.address-detail .name', '.user-info .name',
      '.address-info .name', '[class*="receiver"] [class*="name"]'
    ]);
    
    phone = extractText([
      '.receiver-mobile', '.buyer-mobile', '[data-spm-id="receiverMobile"]', 
      '#consigneeMobile', '.address-detail .mobile', '.user-info .mobile',
      '.address-info .phone', '[class*="receiver"] [class*="mobile"]'
    ]);
    
    // 分机号提取
    const phoneFull = extractText(['.receiver-phone', '.buyer-phone', '[class*="phone-full"]']);
    if (phoneFull) {
      const extMatch = phoneFull.match(/转(\d+)|#(\d+)|分机[：:](\d+)/);
      if (extMatch) phoneExt = extMatch[1] || extMatch[2] || extMatch[3];
    }
    
    address = extractText([
      '.receiver-address', '.buyer-address', '[data-spm-id="receiverAddress"]', 
      '#consigneeAddress', '.address-detail .detail', '.address-info .address',
      '.logistics-address', '[class*="receiver"] [class*="address"]'
    ]);
    
    orderId = extractText([
      '.order-number', '.order-id', '[data-spm-id="orderId"]', 
      '#orderIdInput', '.baobei-info .order-id', '.order-info .order-no',
      '[class*="order-number"]', '[class*="order-no"]'
    ]);
    
    logisticsCode = extractText([
      '.logistics-number', '.ship-code', '[class*="logistics"]', 
      '.waybill-code', '.express-no', '[class*="waybill"]'
    ]);
  } 
  
  // ========== 拼多多 ==========
  else if (urlLower.includes('pinduoduo.com') || urlLower.includes('yangkeduo')) {
    platform = '拼多多';
    
    name = extractText([
      '.user-name', '[class*="name"]', '.receiver-name', 
      '.consignee-name', '.address-info .name', '[class*="consignee"]'
    ]);
    
    phone = extractText([
      '.user-phone', '[class*="phone"]', '.receiver-mobile',
      '.consignee-phone', '.address-info .phone'
    ]);
    
    // 分机号提取
    const pddPhoneEl = document.querySelector('[class*="phone"]');
    if (pddPhoneEl) {
      const text = pddPhoneEl.textContent;
      const extMatch = text.match(/转(\d+)|#(\d+)/);
      if (extMatch) phoneExt = extMatch[1] || extMatch[2];
    }
    
    address = extractText([
      '.user-address', '[class*="address"]', '.receiver-address',
      '.consignee-address', '.address-info .address'
    ]);
    
    orderId = extractText([
      '.order-id', '[class*="orderId"]', '.order-no', 
      '.orderNumber', '[class*="order-no"]'
    ]);
    
    logisticsCode = extractText([
      '.logistics-no', '.shipping-no', '[class*="logistics"]',
      '.waybill-no', '.express-no'
    ]);
  }
  
  // ========== 抖音 ==========
  else if (urlLower.includes('douyin.com') || urlLower.includes('字节')) {
    platform = '抖音';
    
    name = extractText([
      '.delivery-name', '[class*="name"]', '.consignee-name',
      '.receiver-name', '[class*="delivery"] [class*="name"]'
    ]);
    
    phone = extractText([
      '.delivery-phone', '[class*="phone"]', '.consignee-mobile',
      '.receiver-phone', '[class*="delivery"] [class*="phone"]'
    ]);
    
    address = extractText([
      '.delivery-address', '[class*="address"]', '.consignee-address',
      '.receiver-address'
    ]);
    
    orderId = extractText([
      '.order-no', '.order-id', '[class*="order"]',
      '.orderNumber', '[class*="order-no"]'
    ]);
    
    logisticsCode = extractText([
      '.waybill-no', '.express-no', '[class*="waybill"]',
      '.logistics-no'
    ]);
  }
  
  // ========== 京东 ==========
  else if (urlLower.includes('jd.com') || urlLower.includes('jd.hk')) {
    platform = '京东';
    
    name = extractText([
      '.name', '#name', '.consignee-name', '[class*="consignee"]',
      '.address-info .name', '.address-name'
    ]);
    
    phone = extractText([
      '.phone', '#phone', '.consignee-phone', '[class*="phone"]',
      '.address-info .phone', '.address-mobile'
    ]);
    
    address = extractText([
      '.address', '#address', '.consignee-address', '[class*="address"]',
      '.address-info .address', '.address-detail'
    ]);
    
    orderId = extractText([
      '.order-number', '.order-id', '#orderId', '[class*="order"]',
      '.order-no', '.jd-order-id'
    ]);
    
    logisticsCode = extractText([
      '.track-no', '.waybill', '[class*="track"]', '[class*="logistics"]',
      '.express-no'
    ]);
  }
  
  // 清理数据
  if (phone) {
    phone = phone.replace(/\s+/g, '').trim();
  }
  if (address) {
    address = address.replace(/\s+/g, ' ').trim();
  }
  
  return {
    success: !!(name || phone || address),
    name: name,
    phone: phone,
    phoneExt: phoneExt,
    address: address,
    platform: platform,
    orderId: orderId,
    logisticsCode: logisticsCode,
    url: url,
    extractedAt: new Date().toISOString()
  };
}

// 从页面提取文本的辅助函数
function extractText(selectors) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        return el.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

// 从页面提取属性值的辅助函数
function extractValue(selectors) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        const value = el.getAttribute('data-shopid') || 
                     el.getAttribute('data-shop-id') ||
                     el.getAttribute('shopid') ||
                     el.getAttribute('shop-id') ||
                     el.id ||
                     el.value;
        if (value) return value;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

// 生成店铺ID（备用方案）
function generateShopId(platform, shopName) {
  const timestamp = Date.now();
  const hash = simpleHash(platform + shopName + timestamp);
  return `${platform}_${hash}`;
}

// 简单哈希函数
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// 在页面上显示风险标记
function showRiskBadge(data) {
  // 移除旧的标记
  const existing = document.querySelector('.seller-help-risk-badge');
  if (existing) existing.remove();
  
  // 创建新标记
  const badge = document.createElement('div');
  badge.className = 'seller-help-risk const bg-badge';
  
 Color = data.level === 'high' ? '#dc2626' : data.level === 'medium' ? '#d97706' : '#22c55e';
  
  badge.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      padding: 12px 20px;
      background: ${bgColor};
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <span style="font-size: 18px;">🚨</span>
      <span>风险评分: ${data.score}</span>
      <span style="opacity: 0.8; font-size: 12px;">${data.desc}</span>
    </div>
  `;
  
  document.body.appendChild(badge);
  
  // 点击打开详情
  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  // 5秒后自动消失
  setTimeout(() => {
    badge.style.opacity = '0';
    badge.style.transition = 'opacity 0.5s';
    setTimeout(() => badge.remove(), 500);
  }, 5000);
}

// 页面加载完成后自动检测
document.addEventListener('DOMContentLoaded', () => {
  console.log('🛡️ 卖家帮插件已加载');
  
  // 检测是否在商家后台页面
  const urlLower = window.location.href.toLowerCase();
  const isMerchantBackend = 
    urlLower.includes('myseller') ||
    urlLower.includes('erp.pinduoduo') ||
    urlLower.includes('partner.douyin') ||
    urlLower.includes('jshop');
  
  if (isMerchantBackend) {
    console.log('🛡️ 检测到商家后台页面，插件已就绪');
  }
});
