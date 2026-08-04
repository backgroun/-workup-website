"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LogoutLink from "./LogoutLink";

// embed=1로 열리면(모아보기 페이지의 iframe 안) 헤더 없이 내용만 렌더링한다 — 이중 헤더 방지.
export default function NoticesChrome({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  if (embed) {
    return <div className="min-h-screen bg-[#f7f7f5] px-6 py-6">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/notices" className="flex items-center gap-2">
            <span className="text-[15px] font-black tracking-tight text-[#303236]">WORKUP</span>
            <span className="text-[13px] text-gray-400">· 지점 출고 패스</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:inline">{adminName}</span>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-[#303236] transition-colors">
              관리자 대시보드
            </Link>
            <LogoutLink />
          </div>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
