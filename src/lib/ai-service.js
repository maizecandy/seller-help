/**
 * 卖家帮 - AI 服务层
 * 
 * 配置的 API:
 * - 文本: 豆包 doubao-seed-2-0-mini-260215 (免费)
 * - 图片: 智谱 glm-4v-flash (免费)
 */

// 直接读取环境变量
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '95df7c92-c63f-4306-ae75-b2d79d87009d';
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || 'doubao-seed-2-0-mini-260215';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '304ad55564e948c2894b4b384c26ab54.0521hjMt5TfohlPC';
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-4v-flash';

const CONFIG = {
  doubao: {
    apiKey: DOUBAO_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    model: DOUBAO_MODEL
  },
  zhipu: {
    apiKey: ZHIPU_API_KEY,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: ZHIPU_MODEL
  },
  qiniu: {
    accessKey: process.env.QINIU_ACCESS_KEY || '',
    secretKey: process.env.QINIU_SECRET_KEY || '',
    bucket: process.env.QINIU_BUCKET || 'seller-help',
    region: process.env.QINIU_REGION || 'z0'
  }
};

/**
 * 调用豆包 API
 */
async function callDoubao(prompt, options = {}) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.doubao.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024
    });

    const req = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.doubao.apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          if (j.choices) {
            resolve(j.choices[0].message.content);
          } else {
            reject(new Error(j.message || 'API Error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 调用智谱 API (文本)
 */
async function callZhipu(prompt, options = {}) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.zhipu.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024
    });

    const req = https.request({
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.zhipu.apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          if (j.choices) {
            resolve(j.choices[0].message.content);
          } else {
            reject(new Error(j.error?.message || 'API Error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 调用智谱 API (图片理解)
 */
async function callZhipuVision(prompt, imageUrls, options = {}) {
  const https = require('https');
  
  const content = [
    { type: 'text', text: prompt },
    ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } }))
  ];
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.zhipu.model,
      messages: [{ role: 'user', content }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024
    });

    const req = https.request({
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.zhipu.apiKey}`,
        'Content-Length': data.length
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          if (j.choices) {
            resolve(j.choices[0].message.content);
          } else {
            reject(new Error(j.error?.message || 'API Error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 1. 文本智能解析 - 从文本中提取结构化信息
 */
async function parseText(text) {
  const prompt = `你是一个电商订单信息提取专家。请从以下文本中提取结构化信息，以JSON格式返回：
{
  "name": "脱敏后的姓名(如: 张*)",
  "phone": "脱敏后的手机号(如: 138****1234)", 
  "phoneExt": "分机号(如果有)",
  "province": "省份",
  "city": "城市",
  "district": "区县",
  "address": "详细地址",
  "logisticsCode": "物流单号(如果有)",
  "platform": "推断的平台(淘宝/拼多多/抖音/京东)"
}
如果某字段无法提取，请返回null。

文本内容：
${text}`;

  try {
    const result = await callZhipu(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('❌ 文本解析失败:', error.message);
    return null;
  }
}

/**
 * 2. 图片理解 - 订单截图解析
 */
async function parseOrderImage(imageUrl) {
  const prompt = `这是一张电商订单截图，请提取以下信息并以JSON格式返回：
{
  "orderId": "订单号",
  "platform": "平台名称",
  "buyerName": "收件人姓名",
  "buyerPhone": "收件人电话",
  "buyerAddress": "收件人地址",
  "logisticsCode": "物流单号(如果有)"
}
如果某字段无法提取，请返回null。`;

  try {
    const result = await callZhipuVision(prompt, [imageUrl]);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('❌ 订单图片解析失败:', error.message);
    return null;
  }
}

/**
 * 3. 图片理解 - 聊天截图意图分析
 */
async function analyzeChatIntent(imageUrls) {
  const prompt = `这是几张连续的客服聊天截图，请分析买家是否存在以下恶意行为：
- 敲诈勒索（不给钱就差评）
- 承认收到货但要求仅退款
- 威胁给差评索要赔偿
- 诱导好评

请以JSON格式返回：
{
  "hasMaliciousIntent": true/false,
  "intentType": "具体恶意类型(无恶意/敲诈/仅退款/威胁/诱导)",
  "confidence": 0-100,
  "summary": "买家核心诉求摘要"
}`;

  try {
    const result = await callZhipuVision(prompt, imageUrls);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('❌ 聊天截图分析失败:', error.message);
    return null;
  }
}

/**
 * 4. 风险评分计算
 * RS = Σ(Wb × We × F(t))
 */
function calculateRiskScore(records) {
  const WEIGHT_BEHAVIOR = {
    'refund': 0.5,
    'only_refund': 2.0,
    'return_scam': 5.0,
    'blackmail': 4.0,
    'fake_review': 3.0
  };

  const WEIGHT_EVIDENCE = {
    'text': 0.5,
    'image': 1.0,
    'video': 2.0
  };

  let totalScore = 0;
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const sixMonths = 180 * 24 * 60 * 60 * 1000;

  for (const record of records) {
    const Wb = WEIGHT_BEHAVIOR[record.riskType] || 1;
    const We = WEIGHT_EVIDENCE[record.evidenceType] || 0.5;
    
    const age = now - new Date(record.createdAt).getTime();
    let Ft = 1.0;
    if (age > sixMonths) {
      Ft = 0;
    } else if (age > thirtyDays) {
      Ft = Math.exp(-0.01 * (age - thirtyDays) / (24 * 60 * 60 * 1000));
    }

    totalScore += Wb * We * Ft;
  }

  const riskScore = Math.min(100, Math.round(totalScore));
  
  let level = 'low';
  if (riskScore > 80) level = 'critical';
  else if (riskScore > 60) level = 'high';
  else if (riskScore > 30) level = 'medium';

  return { riskScore, level };
}

/**
 * 5. 证据文件上传 (TODO: 需要七牛云 SDK)
 */
async function uploadFile(fileBuffer, fileName) {
  console.log('📤 上传文件:', fileName);
  // TODO: 实现七牛云上传
  return `https://${CONFIG.qiniu.bucket}.oss.example.com/${fileName}`;
}

// 导出
module.exports = {
  CONFIG,
  parseText,
  parseOrderImage,
  analyzeChatIntent,
  calculateRiskScore,
  uploadFile,
  callDoubao,
  callZhipu,
  callZhipuVision
};

// 测试
if (require.main === module) {
  (async () => {
    console.log('🧪 测试豆包 API...');
    try {
      const r = await callDoubao('你好，请用一句话介绍自己');
      console.log('豆包回复:', r);
    } catch (e) {
      console.error('豆包失败:', e.message);
    }
    
    console.log('🧪 测试智谱 API...');
    try {
      const r = await callZhipu('你好，请用一句话介绍自己');
      console.log('智谱回复:', r);
    } catch (e) {
      console.error('智谱失败:', e.message);
    }
  })();
}
