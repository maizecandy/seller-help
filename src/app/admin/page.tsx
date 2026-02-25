"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Search,
  ArrowUp,
  ArrowDown,
  Store,
  DollarSign
} from "lucide-react";

export default function AdminPage() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, lv2: 0, lv3: 0 });
  const [adminToken, setAdminToken] = useState('');
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setAdminToken(savedToken);
      fetchMerchants(savedToken);
    }
  }, []);

  async function fetchMerchants(token: string) {
    try {
      const res = await fetch(`/api/admin/merchants?admin_token=${token}`);
      const data = await res.json();
      
      if (data.success) {
        setMerchants(data.merchants);
        setShowLogin(false);
        
        // 计算统计
        const pending = data.merchants.filter((m: any) => m.status === 'pending').length;
        const lv2 = data.merchants.filter((m: any) => m.level >= 2).length;
        const lv3 = data.merchants.filter((m: any) => m.level >= 3).length;
        setStats({ total: data.merchants.length, pending, lv2, lv3 });
      } else {
        alert(data.error || '获取失败');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: any) {
    e.preventDefault();
    if (adminToken) {
      localStorage.setItem('admin_token', adminToken);
      fetchMerchants(adminToken);
    }
  }

  async function handleAction(merchantId: string, action: string, reason?: string) {
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_token: adminToken,
          merchant_id: merchantId,
          action,
          reason
        })
      });
      const data = await res.json();
      
      if (data.success) {
        fetchMerchants(adminToken);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('操作失败');
    }
  }

  function getLevelBadge(level: number) {
    if (level >= 3) return { label: 'Lv3 认证', color: 'bg-purple-100 text-purple-700' };
    if (level >= 2) return { label: 'Lv2 初级', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Lv1 访客', color: 'bg-gray-100 text-gray-700' };
  }

  function getStatusBadge(status: string) {
    if (status === 'approved') return { label: '已认证', color: 'bg-green-100 text-green-700' };
    if (status === 'rejected') return { label: '已拒绝', color: 'bg-red-100 text-red-700' };
    return { label: '待审核', color: 'bg-yellow-100 text-yellow-700' };
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[#0055FF]/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-[#0055FF]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">管理员登录</h2>
            <p className="text-slate-500 mt-2">请输入管理员 Token</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0055FF]"
                placeholder="请输入管理员 Token"
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
          
          <p className="text-center mt-4 text-xs text-slate-400">
            测试 Token: admin_secret_token
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
            <h2 className="text-lg font-bold text-slate-900">卖家帮管理后台</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">管理员</span>
            <button
              onClick={() => { localStorage.removeItem('admin_token'); setShowLogin(true); }}
              className="text-sm text-red-500 hover:text-red-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">商户总数</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">待审核</span>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">初级卖家</span>
              <Store className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.lv2}</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">认证卖家</span>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.lv3}</p>
          </div>
        </div>

        {/* Merchant List */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-900">商户列表</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">商户</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">店铺</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">等级</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">认证方式</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">注册时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m: any) => {
                  const levelBadge = getLevelBadge(m.level || 1);
                  const statusBadge = getStatusBadge(m.status);
                  
                  return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{m.contactName}</p>
                          <p className="text-xs text-slate-500">{m.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{m.shopName}</p>
                        <p className="text-xs text-slate-500">{m.platforms?.join(', ')}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${levelBadge.color}`}>
                          {levelBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          {m.pluginAuth?.authResult?.passed && (
                            <span className="text-green-600">✓ 插件认证</span>
                          )}
                          {m.realnameAuth?.status === 'approved' && (
                            <span className="text-purple-600 ml-2">✓ 实名认证</span>
                          )}
                          {!m.pluginAuth?.authResult?.passed && !m.realnameAuth && (
                            <span className="text-slate-400">未认证</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        {m.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(m.id, 'approve')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="通过"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAction(m.id, 'reject')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="拒绝"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                        {m.status === 'approved' && (
                          <div className="flex gap-2">
                            {m.level < 3 && (
                              <button
                                onClick={() => handleAction(m.id, 'upgrade')}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                title="升级到Lv3"
                              >
                                <ArrowUp className="h-5 w-5" />
                              </button>
                            )}
                            {m.level > 1 && (
                              <button
                                onClick={() => handleAction(m.id, 'downgrade')}
                                className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                title="降级"
                              >
                                <ArrowDown className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {merchants.length === 0 && (
            <p className="text-center py-8 text-slate-500">暂无商户</p>
          )}
        </div>
      </div>
    </div>
  );
}
