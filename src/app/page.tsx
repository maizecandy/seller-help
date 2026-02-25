import Link from "next/link";
import { Shield, Users, BarChart3, Award, ChevronRight, CheckCircle2, Download, Plug, Search, AlertTriangle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#4A3E3E] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#EADDD2]/30 bg-[#FAF9F6]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight text-[#111418]">卖家帮</h2>
              <span className="text-[10px] font-bold text-[#0055FF]/70 uppercase tracking-widest">免费公益平台</span>
            </div>
          </div>
          
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-medium text-[#4A3E3E]/70 hover:text-[#0055FF] transition-colors" href="/">首页</Link>
            <Link className="text-sm font-medium text-[#4A3E3E]/70 hover:text-[#0055FF] transition-colors" href="/verify">商户入驻</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/verify"
              className="flex h-10 items-center justify-center rounded-full bg-[#0055FF] px-6 text-sm font-bold text-white transition-all hover:bg-[#0055FF]/90 hover:shadow-lg hover:shadow-[#0055FF]/20"
            >
              商户入驻
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-[1200px] px-6 pt-20 pb-16">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="space-y-8 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0055FF]/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0055FF] border border-[#0055FF]/10">
                <Users className="h-4 w-4" />
                卖家互助·温暖同行
              </div>
              
              <h1 className="text-[42px]font-bold leading-[1.2] tracking-tight md:text-[56px] font-serif">
                让每一份诚实经营<br/>
                <span className="text-[#0055FF] relative">
                  不再被恶意辜负
                  <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,12 100,8 T200,8" fill="none" stroke="#0055FF" strokeWidth="2" opacity="0.3"/>
                  </svg>
                </span>
              </h1>
              
              <p className="text-[18px] font-medium leading-relaxed text-[#4A3E3E]/70 max-w-[500px]">
                由一线电商人发起的公益项目。安装插件后，在电商后台一键查询买家风险、举报恶意买家，保护您的店铺安全。
              </p>
              
              {/* 功能列表 */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">一键查询买家风险</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">快速举报恶意买家</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">数据统计与分析</span>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Link 
                  href="/verify"
                  className="flex items-center gap-2 rounded-xl bg-[#0055FF] px-8 py-3 text-[15px] font-bold text-white transition-all hover:shadow-lg hover:shadow-[#0055FF]/20"
                >
                  <Download className="h-5 w-5" />
                  下载插件
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link 
                  href="/verify"
                  className="flex items-center gap-2 rounded-xl border border-[#EADDD2] bg-white px-8 py-3 text-[15px] font-bold text-[#4A3E3E] hover:bg-[#FDF6F0]"
                >
                  立即入驻
                </Link>
              </div>
            </div>
            
            {/* Right Content - Stats */}
            <div className="relative">
              <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[#0055FF]/5 blur-3xl"></div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-3xl border border-[#EADDD2]/40 bg-white p-8 shadow-lg">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50">
                    <Shield className="h-6 w-6 text-[#0055FF]" />
                  </div>
                  <p className="font-serif text-4xl font-bold text-[#4A3E3E]">12,400</p>
                  <p className="mt-2 text-sm font-medium text-[#4A3E3E]/60">已验证举报条目</p>
                </div>
                
                <div className="rounded-3xl border border-[#EADDD2]/40 bg-white p-8 shadow-lg">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-orange-50">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className="font-serif text-4xl font-bold text-[#4A3E3E]">25,842</p>
                  <p className="mt-2 text-sm font-medium text-[#4A3E3E]/60">互助商户数</p>
                </div>
                
                <div className="rounded-3xl border border-[#EADDD2]/40 bg-white p-8 shadow-lg">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-green-50">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="font-serif text-4xl font-bold text-[#4A3E3E]">842</p>
                  <p className="mt-2 text-sm font-medium text-[#4A3E3E]/60">今日查询次数</p>
                </div>
                
                <div className="rounded-3xl border border-[#EADDD2]/40 bg-white p-8 shadow-lg">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-purple-50">
                    <Award className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="font-serif text-4xl font-bold text-[#4A3E3E]">328</p>
                  <p className="mt-2 text-sm font-medium text-[#4A3E3E]/60">平台运营天数</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 插件介绍 */}
        <section className="w-full max-w-[1100px] px-6 pb-24">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#4A3E3E]">插件功能</h2>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* 风险查询 */}
            <div className="group flex flex-col items-center rounded-3xl border border-[#EADDD2]/40 bg-white p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#0055FF]/5 text-[#0055FF]">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#4A3E3E]">一键查询风险</h3>
              <p className="text-sm leading-relaxed text-[#4A3E3E]/60">
                在电商后台复制买家信息，插件自动解析并查询风险评分
              </p>
            </div>
            
            {/* 举报 */}
            <div className="group flex flex-col items-center rounded-3xl border border-[#EADDD2]/40 bg-white p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#4A3E3E]">快速举报</h3>
              <p className="text-sm leading-relaxed text-[#4A3E3E]/60">
                遇到恶意买家，一键提交举报，贡献数据可获得积分奖励
              </p>
            </div>
            
            {/* 商户认证 */}
            <div className="group flex flex-col items-center rounded-3xl border border-[#EADDD2]/40 bg-white p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-green-50 text-green-500">
                <Plug className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#4A3E3E]">插件认证</h3>
              <p className="text-sm leading-relaxed text-[#4A3E3E]/60">
                安装插件后，在电商后台一键完成店铺认证
              </p>
              <Link 
                href="/verify"
                className="mt-6 flex items-center gap-1 text-sm font-bold text-[#0055FF]"
              >
                立即安装 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* 登录入口 */}
        <section className="w-full max-w-[600px] px-6 pb-24">
          <div className="rounded-3xl border border-[#EADDD2]/40 bg-white p-8 text-center">
            <h3 className="mb-2 text-xl font-bold text-[#4A3E3E]">已安装插件？立即登录</h3>
            <p className="mb-6 text-sm text-[#4A3E3E]/60">
              在插件中已完成认证的商户，可在此登录查看数据
            </p>
            <Link 
              href="/verify"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] px-8 py-3 text-[15px] font-bold text-white transition-all hover:shadow-lg hover:shadow-[#0055FF]/20"
            >
              商户登录
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#EADDD2]/30 bg-white py-8">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="text-sm text-[#4A3E3E]/60">
            © 2024 卖家帮 - 免费公益反欺诈平台
          </p>
        </div>
      </footer>
    </div>
  );
}
