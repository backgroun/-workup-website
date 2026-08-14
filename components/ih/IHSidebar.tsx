"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IH_NAV } from "./ih-nav";

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  ),
  influencers: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  sponsors: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41L11 3.83V3a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1h.83l9.58 9.59a2 2 0 002.83 0l3.35-3.35a2 2 0 000-2.83z" />
  ),
  branch: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h.01M9 12h.01M9 15h.01" />
  ),
  pool: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  ),
  ppl: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.68A1 1 0 0121 8.2v7.6a1 1 0 01-1.45.88L15 14M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
  ),
  settings: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

/** Influencer Hub 전용 좌측 사이드바 — 기존 AdminSidebar와 별도(3단 Shell 전용). */
export default function IHSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0f172a] min-h-full flex flex-col">
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white text-[13px] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          관리자 홈
        </Link>
        <p className="mt-3 text-white font-bold text-[15px] tracking-tight">Influencer Hub</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-[3px] overflow-y-auto">
        {IH_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 h-9 pr-3 rounded-md text-[13.5px] font-medium border-l-2 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60 focus-visible:ring-inset ${
                active
                  ? "border-[#3b82f6] bg-white/[0.06] text-white pl-[10px]"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04] pl-3"
              }`}
            >
              <span className={`flex-shrink-0 ${active ? "text-[#60a5fa]" : "text-slate-500"}`}>
                <NavIcon name={item.icon} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-[11px] text-slate-600 font-medium">Influencer Hub · MVP</p>
      </div>
    </aside>
  );
}
