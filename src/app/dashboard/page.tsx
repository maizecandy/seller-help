"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  Lock
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    totalMerchants: 0,
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    platformDistribution: {},
    riskTypeDistribution: {},
    recentReports: []
  });
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });

  useEffect(() => {
    // 检查登录状态
    const savedToken = localStorage.getItem('merchant_token');
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setShowLogin(true);
    }
  }, []);

  async function verifyToken(token: string) {
    try {
      const res = await fetch(`/api/merchant/verify?token=${token}`);
      const data = await res.json();
      if (data.valid) {
        setMerchant(data.merchant);
        fetchDashboardData(token);
      } else {
        setShowLogin(true);
      }
    } catch (e) {
      setShowLogin(true);
    }
  }

  async function handleLogin(e: any) {
    e.preventDefault();
    try {
      const res = await fetch('/api/merchant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('merchant_token', data.token);
        setMerchant(data.merchant);
        setShowLogin(false);
        fetchDashboardData(data.token);
      } else {
        alert(data.error || '登录失败');
      }
    } catch (e) {
      alert('登录失败');
    }
  }

  function handleLogout() {
    localStorage.removeItem('merchant_token');
    setMerchant(null);
    setShowLogin(true);
  }

  async function fetchDashboardData(token: string) {
    try {
      const reportRes = await fetch(`/api/report/submit?token=${token}`);
      const reportData = await reportRes.json();
      
      const riskRes = await fetch('/api/risk/search');
      const riskData = await riskRes.json();
      
      if (reportData.success && riskData.success) {
        const reports = reportData.reports || [];
        const risks = riskData.data || [];
        
        const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
        const platformDistribution: any = {};
        const riskTypeDistribution: any = {};
        
        risks.forEach((r: any) => {
          if (r.riskScore <= 30) riskDistribution.low++;
          else if (r.riskScore <= 60) riskDistribution.medium++;
          else if (r.riskScore <= 80) riskDistribution.high++;
          else riskDistribution.critical++;
        });
        
        reports.forEach((r: any) => {
          platformDistribution[r.platform] = (platformDistribution[r.platform] || 0) + 1;
          riskTypeDistribution[r.riskType] = (riskTypeDistribution[r.riskType] || 0) + 1;
        });
        
        setStats({
          totalReports: reports.length,
          pendingReports: reports.filter((r: any) => r.status === 'pending').length,
          totalMerchants: 128,
          riskDistribution,
          platformDistribution,
          riskTypeDistribution,
          recentReports: reports.slice(-5).reverse()
        });
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[#0055FF]/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-[#0055FF]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">商户登录</h2>
            <p className="text-slate-500 mt-2">登录后可查看数据统计</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
              <input
                type="tel"
                value={loginForm.phone}
                onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                placeholder="请输入手机号"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                placeholder="请输入密码"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#0055FF] text-white font-bold rounded-xl hover:bg-[#0046CC]"
            >
              登录
            </button>
          </form>
          
          <p className="text-center mt-4 text-sm text-slate-500">
            还没有账号？ <a href="/verify" className="text-[#0055FF]">立即注册</a>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0055FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#0055FF] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">卖家帮商户后台</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{merchant?.shopName}</p>
              <p className="text-xs text-slate-500">ID: {merchant?.id}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">我的举报</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalReports}</p>
            <p className="mt-2 text-xs text-green-600">贡献值 +{stats.totalReports * 10}</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">待审核</span>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.pendingReports}</p>
            <p className="mt-2 text-xs text-orange-600">需要处理</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">平台总量</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalMerchants}</p>
            <p className="mt-2 text-xs text-blue-600">认证商户</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">认证状态</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">已认证</p>
            <p className="mt-2 text-xs text-slate-500">有效期至 2025-12-31</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left - Risk Distribution */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-slate-900">风险等级分布</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{stats.riskDistribution.low}</p>
                  <p className="text-xs text-green-700 mt-1">低风险</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-yellow-50">
                  <p className="text-2xl font-bold text-yellow-600">{stats.riskDistribution.medium}</p>
                  <p className="text-xs text-yellow-700 mt-1">中风险</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-orange-50">
                  <p className="text-2xl font-bold text-orange-600">{stats.riskDistribution.high}</p>
                  <p className="text-xs text-orange-700 mt-1">高风险</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{stats.riskDistribution.critical}</p>
                  <p className="text-xs text-red-700 mt-1">极高危</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-slate-900">风险类型分布</h3>
              <div className="space-y-4">
                {Object.entries(stats.riskTypeDistribution).map(([type, count]: [string, any]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{type === 'only_refund' ? '恶意仅退款' : type === 'return_scam' ? '退货调包' : type === 'blackmail' ? '敲诈勒索' : type === 'fake_review' ? '职业差评' : type}</span>
                      <span className="text-sm font-bold text-red-500">{count}次</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full bg-red-500" 
                        style={{ width: `${stats.totalReports > 0 ? (count / stats.totalReports) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-slate-900">平台分布</h3>
              <div className="space-y-4">
                {Object.entries(stats.platformDistribution).map(([platform, count]: [string, any]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        platform === 'pinduoduo' ? 'bg-orange-100 text-orange-600' :
                        platform === 'taobao' ? 'bg-blue-100 text-blue-600' :
                        platform === 'douyin' ? 'bg-black text-white' :
                        'bg-red-100 text-red-600'
                      } font-bold text-xs`}>
                        {platform === 'pinduoduo' ? '多多' : platform === 'taobao' ? '淘' : platform === 'douyin' ? '抖音' : '京东'}
                      </div>
                      <span className="text-sm font-medium">{platform === 'pinduoduo' ? '拼多多' : platform === 'taobao' ? '淘宝/天猫' : platform === 'douyin' ? '抖音' : platform === 'jd' ? '京东' : platform}</span>
                    </div>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-slate-900">我的举报</h3>
              <div className="space-y-4">
                {stats.recentReports.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">暂无举报记录</p>
                ) : (
                  stats.recentReports.map((report: any, i: any) => (
                    <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {report.riskType === 'only_refund' ? '恶意仅退款' : 
                           report.riskType === 'return_scam' ? '退货调包' : 
                           report.riskType === 'blackmail' ? '敲诈勒索' : 
                           report.riskType === 'fake_review' ? '职业差评' : report.riskType}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.platform} · {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {report.status === 'pending' ? '待审核' : '已处理'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
