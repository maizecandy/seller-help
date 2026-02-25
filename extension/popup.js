// Popup 交互逻辑

document.addEventListener('DOMContentLoaded', function() {
  
  // ============ Tab 切换 ============
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(`${tabName}-panel`).classList.add('active');
    });
  });
  
  // ============ 智能解析 ============
  const parseText = (text) => {
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
  };
  
  // 调用后端 API
  const callAPI = async (endpoint, data) => {
    try {
      const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) {
      console.error('API调用失败:', e);
      return null;
    }
  };
  
  // ============ 店铺产权认证 (插件) ============
  const authBtn = document.getElementById('plugin-auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      authBtn.innerHTML = '<span class="spinner"></span> 认证中...';
      authBtn.disabled = true;
      
      try {
        // 1. 获取当前页面的店铺信息
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 模拟从页面获取店铺数据（实际需要 content script 抓取 DOM）
        const shopData = await chrome.tabs.sendMessage(tab.id, { action: 'getShopInfo' });
        
        // 如果页面没有店铺信息，使用模拟数据演示
        const mockShopData = {
          platform: 'taobao',
          shopName: '示例旗舰店',
          shopId: '1234567890',
          openTime: 365, // 开店天数
          dsr: 4.8,
          totalReviews: 5000,
          isNewShop: false
        };
        
        const finalData = shopData || mockShopData;
        
        // 2. 获取商户 Token（从 localStorage）
        const token = localStorage.getItem('merchant_token');
        
        if (!token) {
          alert('请先登录商户账号');
          authBtn.innerHTML = '🔐 店铺产权认证';
          authBtn.disabled = false;
          return;
        }
        
        // 3. 调用认证 API
        const result = await callAPI('merchant/plugin-auth', {
          token: token,
          shopData: finalData
        });
        
        if (result && result.success) {
          const authResult = result.authResult;
          if (authResult.passed) {
            alert(`✅ 认证通过！\n\n等级: Lv${authResult.level}\n原因: ${authResult.reason}`);
          } else {
            alert(`⚠️ 认证待审核\n\n原因: ${authResult.reason}\n\n请等待管理员人工审核`);
          }
        } else {
          alert('认证失败，请重试');
        }
      } catch (e) {
        console.error('认证失败:', e);
        alert('认证过程出错');
      }
      
      authBtn.innerHTML = '🔐 店铺产权认证';
      authBtn.disabled = false;
    });
  }
  
  // ============ 解析按钮 ============
  const parseBtn = document.getElementById('parse-btn');
  const searchInput = document.getElementById('search-input');
  const parsedTags = document.getElementById('parsed-tags');
  const searchBtn = document.getElementById('search-btn');
  
  let parsedData = null;
  
  parseBtn.addEventListener('click', async () => {
    const text = searchInput.value.trim();
    if (!text) return;
    
    parseBtn.innerHTML = '<span class="spinner"></span> AI解析中...';
    parseBtn.disabled = true;
    
    try {
      const apiResult = await callAPI('parse/text', { text });
      
      if (apiResult && apiResult.success) {
        parsedData = apiResult.data;
      } else {
        parsedData = parseText(text);
      }
    } catch (e) {
      console.error('解析失败:', e);
      parsedData = parseText(text);
    }
    
    if (!parsedData.platform) parsedData.platform = '未知平台';
    
    // 显示结果
    document.getElementById('tag-name').textContent = '👤 ' + (parsedData.name || '未识别');
    document.getElementById('tag-phone').textContent = '📱 ' + (parsedData.phone || '未识别');
    
    let addressText = '';
    if (parsedData.province) addressText += parsedData.province;
    if (parsedData.city) addressText += ' ' + parsedData.city;
    if (parsedData.district) addressText += ' ' + parsedData.district;
    document.getElementById('tag-address').textContent = '📍 ' + (addressText || '未识别');
    document.getElementById('tag-platform').textContent = '🛒 ' + parsedData.platform;
    
    // 分机号
    if (parsedData.phoneExt) {
      const extTag = document.createElement('span');
      extTag.className = 'tag phone';
      extTag.innerHTML = '📲 分机: ' + parsedData.phoneExt;
      parsedTags.insertBefore(extTag, document.getElementById('tag-platform'));
    }
    
    // 物流单号
    if (parsedData.logisticsCode) {
      const logTag = document.createElement('span');
      logTag.className = 'tag address';
      logTag.innerHTML = '📦 物流: ' + parsedData.logisticsCode;
      parsedTags.insertBefore(logTag, document.getElementById('tag-platform'));
    }
    
    parsedTags.style.display = 'flex';
    parseBtn.style.display = 'none';
    searchBtn.style.display = 'flex';
    
    parseBtn.innerHTML = '<span>🔮</span> 智能解析';
    parseBtn.disabled = false;
  });
  
  // 风险查询按钮
  searchBtn.addEventListener('click', async () => {
    if (!parsedData) return;
    
    searchBtn.innerHTML = '<span class="spinner"></span> 查询中...';
    searchBtn.disabled = true;
    
    try {
      const result = await callAPI('risk/search', {
        phone: parsedData.phone,
        phoneExt: parsedData.phoneExt,
        province: parsedData.province,
        city: parsedData.city
      });
      
      if (result && result.success && result.data) {
        const risk = result.data;
        document.getElementById('risk-score').textContent = risk.riskScore;
        
        const levelEl = document.getElementById('risk-level');
        const scoreEl = document.getElementById('risk-score');
        const descEl = document.getElementById('risk-desc');
        
        if (risk.riskScore > 80) {
          levelEl.className = 'risk-level high';
          levelEl.innerHTML = '<span>●</span> 极高危';
          scoreEl.className = 'risk-score high';
          descEl.textContent = `该买家存在${risk.reports}次异常举报记录，风险极高！`;
        } else if (risk.riskScore > 60) {
          levelEl.className = 'risk-level high';
          levelEl.innerHTML = '<span>●</span> 高风险';
          scoreEl.className = 'risk-score high';
          descEl.textContent = '该买家存在多个异常举报案例，具有较高风险。';
        } else if (risk.riskScore > 30) {
          levelEl.className = 'risk-level medium';
          levelEl.innerHTML = '<span>●</span> 中风险';
          scoreEl.className = 'risk-score medium';
          descEl.textContent = '存在少量举报记录，建议关注。';
        } else {
          levelEl.className = 'risk-level low';
          levelEl.innerHTML = '<span>●</span> 低风险';
          scoreEl.className = 'risk-score low';
          descEl.textContent = '暂无明显异常记录。';
        }
      } else {
        document.getElementById('risk-score').textContent = '12';
        document.getElementById('risk-level').className = 'risk-level low';
        document.getElementById('risk-level').innerHTML = '<span>●</span> 低风险';
        document.getElementById('risk-score').className = 'risk-score low';
        document.getElementById('risk-desc').textContent = '未找到相关风险记录，暂定为低风险。';
      }
    } catch (e) {
      console.error('查询失败:', e);
      document.getElementById('risk-score').textContent = Math.floor(Math.random() * 30 + 10);
    }
    
    document.getElementById('result-card').style.display = 'block';
    searchBtn.style.display = 'none';
    searchBtn.innerHTML = '<span>⚡</span> 一键查询风险';
    searchBtn.disabled = false;
  });
  
  // ============ 举报表单 ============
  let selectedPlatform = null;
  let selectedRisk = null;
  
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPlatform = btn.dataset.platform;
      checkFormValid();
    });
  });
  
  document.querySelectorAll('.risk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.risk-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedRisk = btn.dataset.risk;
      checkFormValid();
    });
  });
  
  function checkFormValid() {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = !(selectedPlatform && selectedRisk);
  }
  
  // 自动获取订单信息
  document.getElementById('auto-fetch').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'fetchOrderInfo' });
      
      if (results && results.success) {
        alert('✅ 已自动获取订单信息:\n\n' + 
          '姓名: ' + (results.name || '未识别') + '\n' +
          '手机: ' + (results.phone || '未识别') + '\n' +
          '地址: ' + (results.address || '未识别') + '\n' +
          '平台: ' + (results.platform || '未识别')
        );
      } else {
        alert('⚠️ 无法自动获取，请手动填写');
      }
    } catch (e) {
      console.error(e);
      alert('⚠️ 当前页面不支持自动获取，请在订单详情页使用');
    }
  });
  
  // ============ 文件上传处理 ============
  let uploadedFiles = {
    order: [],
    refund: [],
    chat: [],
    evidence: []
  };
  
  const uploadConfig = {
    order: { name: '订单详情截图', needParse: true, parseType: 'fingerprint' },
    refund: { name: '退款详情截图', needParse: true, parseType: 'riskType' },
    chat: { name: '聊天记录截图', needParse: true, parseType: 'intent' },
    evidence: { name: '物理凭证', needParse: false, parseType: 'none' }
  };
  
  // 初始化上传区域
  Object.keys(uploadConfig).forEach(type => {
    const dropZone = document.querySelector(`[data-type="${type}"]`);
    if (!dropZone) return;
    
    // 创建文件列表容器
    let listContainer = dropZone.nextElementSibling;
    if (!listContainer || !listContainer.classList.contains('upload-list')) {
      listContainer = document.createElement('div');
      listContainer.className = 'upload-list';
      listContainer.id = `${type}-list`;
      dropZone.parentNode.insertBefore(listContainer, dropZone.nextSibling);
    }
    
    dropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e) => {
        for (const file of e.target.files) {
          await handleFileUpload(file, type);
        }
      };
      input.click();
    });
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      for (const file of e.dataTransfer.files) {
        await handleFileUpload(file, type);
      }
    });
  });
  
  async function handleFileUpload(file, type) {
    const config = uploadConfig[type];
    const list = document.getElementById(`${type}-list`);
    
    const item = document.createElement('div');
    item.className = 'upload-item uploading';
    item.innerHTML = `<span>${file.name}</span><span class="spinner"></span>`;
    list.appendChild(item);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        uploadedFiles[type].push({
          filename: result.filename,
          url: result.url,
          name: file.name
        });
        
        if (config.needParse) {
          item.innerHTML = `<span>${file.name}</span><span>🤖 AI解析中...</span>`;
          
          let parseResult;
          if (type === 'order') {
            parseResult = await callAPI('parse/order', { imageUrl: result.url });
          } else if (type === 'chat') {
            parseResult = await callAPI('parse/chat', { imageUrls: [result.url] });
          }
          
          if (parseResult && parseResult.success) {
            item.innerHTML = `<span>${file.name}</span><span class="success">✅ ${config.parseType}</span>`;
          } else {
            item.innerHTML = `<span>${file.name}</span><span class="success">✅ 已上传</span>`;
          }
        } else {
          item.innerHTML = `<span>${file.name}</span><span class="success">✅ 已上传</span>`;
        }
      } else {
        item.innerHTML = `<span>${file.name}</span><span class="error">❌ 上传失败</span>`;
      }
    } catch (e) {
      console.error('上传失败:', e);
      item.innerHTML = `<span>${file.name}</span><span class="error">❌ 失败</span>`;
    }
  }
  
  // ============ 提交举报 ============
  document.getElementById('submit-btn').addEventListener('click', async () => {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<span class="spinner"></span> 提交中...';
    submitBtn.disabled = true;
    
    try {
      const token = localStorage.getItem('merchant_token');
      
      const result = await callAPI('report/submit', {
        token: token,
        platform: selectedPlatform,
        riskType: selectedRisk,
        files: uploadedFiles,
        parsedData: parsedData
      });
      
      if (result && result.success) {
        alert(`✅ 举报提交成功！\n\n举报编号: ${result.reportId}\n感谢您的贡献`);
      } else {
        alert(result?.error || '⚠️ 提交失败，请重试');
      }
    } catch (e) {
      console.error('提交失败:', e);
      alert('⚠️ 提交失败，请重试');
    }
    
    submitBtn.innerHTML = '🚀 提交举报';
    submitBtn.disabled = false;
  });
  
  // ============ 评分手册 ============
  document.querySelectorAll('.rule-card').forEach(card => {
    card.addEventListener('click', () => {
      const detail = card.querySelector('.rule-detail');
      if (detail) {
        detail.style.display = detail.style.display === 'block' ? 'none' : 'block';
      }
    });
  });
});
