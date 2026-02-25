/**
 * 卖家帮 - 支付宝实名认证服务
 * 
 * 使用支付宝开放平台的身份认证服务
 * 需要企业资质申请开通
 */

const ALIPAY_CONFIG = {
  // 沙箱环境配置
  sandbox: {
    appId: process.env.ALIPAY_APP_ID || '2021xxxxxxxx',  // 替换为你的AppID
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',    // 应用私钥
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '', // 支付宝公钥
    gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    authUrl: 'https://openauth-sandbox.alipaydev.com/oauth2/public/authorize'
  },
  // 生产环境配置
  production: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    authUrl: 'https://openauth.alipay.com/oauth2/public/authorize'
  }
};

/**
 * 生成授权 URL
 * 商户跳转用户到此 URL 进行授权
 */
function generateAuthUrl(redirectUri, state) {
  const config = process.env.NODE_ENV === 'production' 
    ? ALIPAY_CONFIG.production 
    : ALIPAY_CONFIG.sandbox;
  
  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: redirectUri,
    scope: 'auth_user',
    state: state || 'seller_help_auth',
    response_type: 'code'
  });
  
  return `${config.authUrl}?${params.toString()}`;
}

/**
 * 通过授权码获取用户信息
 */
async function getUserInfoByCode(authCode) {
  const config = process.env.NODE_ENV === 'production'
    ? ALIPAY_CONFIG.production
    : ALIPAY_CONFIG.sandbox;
  
  // 1. 通过授权码获取 access_token
  const tokenResult = await requestAlipay({
    method: 'alipay.system.oauth.token',
    app_id: config.appId,
    private_key: config.privateKey,
    alipay_public_key: config.alipayPublicKey,
    grant_type: 'authorization_code',
    code: authCode
  });
  
  if (!tokenResult.access_token) {
    throw new Error('获取access_token失败');
  }
  
  // 2. 通过 access_token 获取用户信息
  const userResult = await requestAlipay({
    method: 'alipay.user.info.share',
    app_id: config.appId,
    private_key: config.privateKey,
    alipay_public_key: config.alipayPublicKey,
    auth_token: tokenResult.access_token
  });
  
  return {
    alipayUserId: userResult.user_id,
    nickName: userResult.nick_name,
    realName: userResult.real_name,
    avatar: userResult.avatar
  };
}

/**
 * 验证支付宝账号与姓名的匹配
 * 用于确认商户提交的支付宝信息与实名一致
 */
async function verifyAlipayAccount(account, name) {
  const config = process.env.NODE_ENV === 'production'
    ? ALIPAY_CONFIG.production
    : ALIPAY_CONFIG.sandbox;
  
  // 使用支付宝实名认证服务验证
  const result = await requestAlipay({
    method: 'alipay.user.certify.open.verify',
    app_id: config.appId,
    private_key: config.privateKey,
    alipay_public_key: config.alipayPublicKey,
    scene: 'verify_identity',
    identity_type: 'ALIPAY_LOGON_ID',  // 支付宝账号
    identity_param: JSON.stringify({
      logon_id: account
    }),
    cert_name: name,
    cert_type: 'ID_CARD'  // 这里需要根据实际情况调整
  });
  
  return result.verify_success === 'T';
}

/**
 * 模拟验证（开发环境使用）
 * 实际开发中需要真正对接支付宝API
 */
async function mockVerifyAlipayAccount(account, name, companyName) {
  // 模拟验证逻辑
  // 开发环境直接返回成功
  console.log(`[Mock] 验证支付宝账号: ${account}, 姓名: ${name}, 企业: ${companyName}`);
  return {
    success: true,
    message: '认证成功（模拟）'
  };
}

/**
 * 请求支付宝 API 的底层方法
 */
async function requestAlipay(params) {
  const https = require('https');
  const crypto = require('crypto');
  
  // 生成签名
  const signParams = {
    ...params,
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0'
  };
  
  // 构建待签名字符串
  const signString = Object.keys(signParams)
    .sort()
    .map(key => `${key}=${signParams[key]}`)
    .join('&');
  
  // RSA2 签名
  const sign = crypto.sign('sha256WithRSAEncryption', 
    Buffer.from(signString), 
    { key: params.private_key, padding: crypto.constants.RSA_PADDING }
  ).toString('base64');
  
  signParams.sign = sign;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(signParams);
    
    const config = process.env.NODE_ENV === 'production'
      ? ALIPAY_CONFIG.production
      : ALIPAY_CONFIG.sandbox;
    
    const url = new URL(config.gateway);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const responseKey = Object.keys(result).find(k => k.endsWith('_response'));
          resolve(result[responseKey] || {});
        } catch (e) {
          reject(e);
        }
         req.on(' });
    });
    
error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * 生成认证二维码（用于移动端授权）
 */
function generateQRCodeUrl(merchantId) {
  const redirectUri = encodeURIComponent(
    process.env.ALIPAY_REDIRECT_URI || 'http://localhost:3000/api/merchant/alipay-callback'
  );
  
  return generateAuthUrl(redirectUri, merchantId);
}

module.exports = {
  ALIPAY_CONFIG,
  generateAuthUrl,
  getUserInfoByCode,
  verifyAlipayAccount,
  mockVerifyAlipayAccount,
  generateQRCodeUrl
};
