import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get("wu-auth")?.value;
  if (token !== (process.env.AUTH_TOKEN ?? "wu-session-ok")) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-[#0f172a] h-16 flex items-center justify-between px-8 flex-shrink-0 z-20 border-b border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1d4ed8] rounded-lg flex items-center justify-center">
              <span className="text-white text-[13px] font-black tracking-tight">WU</span>
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide leading-none">WORKUP</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Admin Dashboard</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
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
        </div>
      </header>

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-[#f1f5f9]">
          <div className="px-10 pt-5 pb-10 admin-content" style={{ zoom: 1.2 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
