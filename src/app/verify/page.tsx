"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  CheckCircle2, 
  Loader2, 
  Store, 
  Building2, 
  Phone, 
  Lock,
  CreditCard,
  Wallet,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User
} from "lucide-react";

export default function VerifyPage() {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<any>({
    shopName: "",
    contactName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    platforms: []
  });

  const [realnameData, setRealnameData] = useState({
    companyName: "",
    creditCode: "",
    legalPerson: "",
    alipayAccount: "",
    alipayName: ""
  });

  // 检查登录状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    const token = localStorage.getItem('merchant_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/merchant/verify?token=${token}`);
      const data = await res.json();
      
      if (data.valid) {
        setMerchant(data.merchant);
        setStep(10); // 已登录，显示认证状态
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const platformOptions = [
    { id: "taobao", label: "淘宝/天猫" },
    { id: "pinduoduo", label: "拼多多" },
    { id: "douyin", label: "抖音" },
    { id: "jd", label: "京东" },
  ];

  const togglePlatform = (id: string) => {
    const current = formData.platforms || [];
    const updated = current.includes(id)
      ? current.filter((p: any) => p !== id)
      : [...current, id];
    setFormData({...formData, platforms: updated});
  };

  // 注册
  async function handleRegister() {
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/merchant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: formData.shopName,
          contactName: formData.contactName,
          phone: formData.phone,
          password: formData.password,
          platforms: formData.platforms
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('注册成功！请登录');
        setStep(2); // 跳转到登录
      } else {
        setError(data.error || '注册失败');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  // 登录
  async function handleLogin() {
    setError('');
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/merchant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('merchant_token', data.token);
        setMerchant(data.merchant);
        // 首次登录引导去认证
        if (!data.merchant.level || data.merchant.level === 1) {
          setStep(12); // 去认证引导
        } else {
          setStep(10); // 已认证，去商户中心
        }
      } else {
        setError(data.error || '登录失败');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  // 实名认证
  async function handleRealnameAuth() {
    setError('');
    setIsSubmitting(true);
    
    const token = localStorage.getItem('merchant_token');
    
    try {
      const res = await fetch('/api/merchant/realname-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('实名认证通过！恭喜升级为 Lv3 认证卖家');
        if (merchant) {
          setMerchant({...merchant, level: 3});
        }
      } else {
        setError(data.error || '认证失败');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0055FF]"></div>
      </div>
    );
  }

  // 已登录 - 显示认证状态和升级流程
  if (step === 10 && merchant) {
    const isLv1 = !merchant.level || merchant.level === 1;
    
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="mx-auto max-w-2xl">
          {/* 欢迎提示 - 仅 Lv1 显示 */}
          {isLv1 && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white mb-6">
              <h2 className="text-xl font-bold mb-2">🎉 欢迎加入卖家帮！</h2>
              <p className="text-blue-100 text-sm mb-4">完成店铺认证，解锁查询和举报功能</p>
              <button 
                onClick={() => setStep(12)}  // 去认证
                className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl"
              >
                立即认证
              </button>
            </div>
          )}
          
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0055FF]/10">
              <Shield className="h-8 w-8 text-[#0055FF]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">商户中心</h1>
            <p className="mt-2 text-slate-500">{merchant.shopName}</p>
          </div>

          {/* 当前等级 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-bold mb-4">当前等级</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  merchant.level >= 3 ? 'bg-purple-100' : 
                  merchant.level >= 2 ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <span className="text-2xl font-bold">Lv{merchant.level || 1}</span>
                </div>
                <div>
                  <p className="font-medium">{
                    merchant.level >= 3 ? '认证卖家' :
                    merchant.level >= 2 ? '初级卖家' : '访客'
                  }</p>
                  <p className="text-sm text-slate-500">{
                    merchant.level >= 3 ? '可提现分红' :
                    merchant.level >= 2 ? '可查询和举报' : '仅查看首页'
                  }</p>
                </div>
              </div>
              <button 
                onClick={() => { localStorage.removeItem('merchant_token'); setMerchant(null); setStep(1); }}
                className="text-sm text-red-500"
              >
                退出登录
              </button>
            </div>
          </div>

          {/* 认证步骤 */}
          <div className="space-y-4">
            {/* Lv2 店铺认证 */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm ${merchant.level >= 2 ? 'border-2 border-green-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    {merchant.level >= 2 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Store className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold">Step 1: 店铺产权认证</h4>
                    <p className="text-sm text-slate-500">安装插件，在电商后台一键认证</p>
                  </div>
                </div>
                {merchant.level >= 2 ? (
                  <span className="text-green-500 font-medium">已通过</span>
                ) : (
                  <button 
                    onClick={() => alert('请在浏览器插件中点击"店铺产权认证"按钮')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    去认证
                  </button>
                )}
              </div>
            </div>

            {/* Lv3 实名认证 */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm ${merchant.level >= 3 ? 'border-2 border-green-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    {merchant.level >= 3 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <User className="w-6 h-6 text-purple-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold">Step 2: 实名认证 (可选)</h4>
                    <p className="text-sm text-slate-500">上传营业执照，绑定支付宝</p>
                  </div>
                </div>
                {merchant.level >= 3 ? (
                  <span className="text-green-500 font-medium">已通过</span>
                ) : merchant.level >= 2 ? (
                  <button 
                    onClick={() => setStep(11)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium"
                  >
                    去认证
                  </button>
                ) : (
                  <span className="text-slate-400 text-sm">需先完成 Lv2</span>
                )}
              </div>
            </div>
          </div>

          {/* Lv3 实名认证表单 */}
          {Number(step) === 11 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
              <h3 className="font-bold mb-4">实名认证 (Lv3)</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                  {success}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">企业名称</label>
                  <input
                    type="text"
                    value={realnameData.companyName}
                    onChange={(e) => setRealnameData({...realnameData, companyName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="营业执照上的企业名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">统一社会信用代码</label>
                  <input
                    type="text"
                    value={realnameData.creditCode}
                    onChange={(e) => setRealnameData({...realnameData, creditCode: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="18位信用代码"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">法人姓名</label>
                  <input
                    type="text"
                    value={realnameData.legalPerson}
                    onChange={(e) => setRealnameData({...realnameData, legalPerson: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="必须与支付宝实名一致"
                  />
                </div>
                
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">支付宝绑定</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">支付宝账号</label>
                  <input
                    type="text"
                    value={realnameData.alipayAccount}
                    onChange={(e) => setRealnameData({...realnameData, alipayAccount: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="手机号或邮箱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">支付宝实名</label>
                  <input
                    type="text"
                    value={realnameData.alipayName}
                    onChange={(e) => setRealnameData({...realnameData, alipayName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="必须与营业执照法人一致"
                  />
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                  ⚠️ 支付宝姓名必须与营业执照法人姓名或企业名称一致，否则将认证失败
                </div>
                
                <button
                  onClick={handleRealnameAuth}
                  disabled={isSubmitting || !realnameData.companyName || !realnameData.alipayName}
                  className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  提交实名认证
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 12: 认证引导（首次登录后）
  if (step === 12) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">开启保护之旅</h1>
            <p className="mt-2 text-slate-500">完成认证，解锁全部功能</p>
          </div>

          {/* 认证步骤 */}
          <div className="space-y-4">
            {/* Step 1: 店铺认证 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">店铺产权认证</h3>
                  <p className="text-sm text-slate-500 mt-1">安装插件，打开电商后台一键认证</p>
                  <div className="mt-4 flex gap-3">
                    <button 
                      onClick={() => alert('请在浏览器插件中点击"店铺产权认证"按钮')}
                      className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl"
                    >
                      立即认证
                    </button>
                    <button 
                      onClick={() => setStep(10)}
                      className="px-4 py-3 border border-slate-200 text-slate-500 font-medium rounded-xl"
                    >
                      暂不
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: 实名认证（可选） */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-purple-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">实名认证 <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded ml-2">可选</span></h3>
                  <p className="text-sm text-slate-500 mt-1">绑定支付宝，开启提现分红功能</p>
                  <button 
                    onClick={() => setStep(11)}
                    className="mt-4 w-full py-3 border-2 border-purple-200 text-purple-600 font-bold rounded-xl hover:bg-purple-50"
                  >
                    立即绑定
                  </button>
                </div>
              </div>
            </div>

            {/* 跳过按钮 */}
            <button 
              onClick={() => setStep(10)}
              className="w-full py-3 text-slate-400 text-sm"
            >
              先看看，稍后再认证 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: 注册表单
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0055FF]/10">
              <Shield className="h-8 w-8 text-[#0055FF]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">商户注册</h1>
            <p className="mt-2 text-slate-500">创建账号，开启卖家保护之旅</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">店铺名称 *</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="请输入店铺名称"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">联系人 *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="请输入联系人姓名"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">手机号 *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">运营平台</label>
                <div className="grid grid-cols-4 gap-2">
                  {platformOptions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`py-2 px-3 border-2 rounded-xl text-sm font-medium transition-all ${
                        formData.platforms.includes(p.id)
                          ? 'border-[#0055FF] bg-blue-50 text-[#0055FF]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">密码 *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="至少6位"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">确认密码 *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="再次输入密码"
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={isSubmitting || !formData.shopName || !formData.contactName || !formData.phone || !formData.password}
                className="w-full py-3 bg-[#0055FF] text-white font-bold rounded-xl hover:bg-[#0046CC] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                注册
              </button>
            </div>

            <p className="text-center mt-4 text-sm text-slate-500">
              已有账号？ 
              <button onClick={() => setStep(2)} className="text-[#0055FF] font-medium">
                立即登录
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: 登录表单
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0055FF]/10">
              <Shield className="h-8 w-8 text-[#0055FF]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">商户登录</h1>
            <p className="mt-2 text-slate-500">登录后完善认证，享受完整服务</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                    placeholder="请输入密码"
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isSubmitting || !formData.phone || !formData.password}
                className="w-full py-3 bg-[#0055FF] text-white font-bold rounded-xl hover:bg-[#0046CC] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                登录
              </button>
            </div>

            <p className="text-center mt-4 text-sm text-slate-500">
              没有账号？ 
              <button onClick={() => setStep(1)} className="text-[#0055FF] font-medium">
                立即注册
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
