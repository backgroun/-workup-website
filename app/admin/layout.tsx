import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { getAdminMember } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 통합 회원 인증: 로그인한 회원 중 grade="관리자" 인 경우만 접근 허용.
  const admin = await getAdminMember();
  if (!admin) {
    redirect("/member/login?from=admin");
  }
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-[#0f172a] h-16 flex items-center justify-between px-8 flex-shrink-0 z-20 border-b border-white/5">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="flex items-center gap-3 group" title="대시보드로 이동">
            <div className="w-9 h-9 bg-[#1d4ed8] rounded-lg flex items-center justify-center">
              <span className="text-white text-[13px] font-black tracking-tight">WU</span>
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide leading-none group-hover:text-blue-300 transition-colors">WORKUP</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Admin Dashboard</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-slate-400 text-sm hidden sm:inline">
            {admin.name} <span className="text-slate-600">·</span> 관리자
          </span>
          <Link
            href="/notices"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1d4ed8] hover:bg-[#1e4fd1] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            지점 출고 패스
          </Link>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            사이트 미리보기
          </a>
          <AdminLogoutButton />
        </div>
      </header>

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden">
        <AdminShell>{children}</AdminShell>
      </div>
    </div>
  );
}
