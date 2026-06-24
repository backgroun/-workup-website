"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DEFAULT_HEADER_NAV, type NavMenuItem } from "@/lib/header-nav";

export default function BottomNav({
  navItems = DEFAULT_HEADER_NAV.items,
  studioEnabled = true,
}: {
  navItems?: NavMenuItem[];
  studioEnabled?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // 메뉴 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* 백드롭 — 네비바(z-60) 아래 */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[58] bg-black/50 transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/*
        바텀시트
        - bottom-14 : 하단 네비바(h-14=56px) 바로 위에서 시작
        - translateY(100%) : 닫힌 상태 → 자신의 높이만큼 아래로 내려가
                             네비바 뒤로 완전히 숨음
        - translateY(0)    : 열린 상태 → 네비바 위에 딱 붙어서 노출
      */}
      <div
        className="fixed left-0 right-0 z-[59] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out md:hidden"
        style={{
          bottom: "64px",
          transform: menuOpen ? "translateY(0)" : "translateY(110%)",
        }}
        aria-modal="true"
        role="dialog"
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3.5 pb-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 시트 내부 헤더 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <span className="text-[11px] font-bold text-[#1A2B4A] tracking-[0.2em]">MENU</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메뉴 항목 — 시트가 열릴 때 위에서부터 순차로 슬라이드업(stagger) */}
        <nav className="px-6 pb-4 pt-1">
          {/* 티셔츠 꾸미기 스튜디오 — 관리자에서 활성화 시 노출 */}
          {studioEnabled && (
            <div
              className="border-b border-gray-100 transition-[opacity,transform] duration-300 ease-out"
              style={{
                transitionDelay: menuOpen ? "90ms" : "0ms",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(10px)",
              }}
            >
              <Link
                href="/studio"
                className="flex items-center justify-between py-4 text-[13px] font-bold text-[#ff550c] tracking-[0.15em] transition-transform active:scale-[0.97]"
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  STUDIO
                  <span className="text-[9px] font-bold bg-[#ff550c] text-white rounded-full px-1.5 py-0.5 tracking-normal">NEW</span>
                  <span className="text-[11px] font-medium text-gray-400 tracking-normal">티셔츠 꾸미기</span>
                </span>
                <svg className="w-3.5 h-3.5 text-[#ff550c]/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          )}
          {navItems.map((item, i) => (
            <div
              key={item.id}
              className="border-b border-gray-100 last:border-0 transition-[opacity,transform] duration-300 ease-out"
              style={{
                transitionDelay: menuOpen ? `${i * 45 + 120}ms` : "0ms",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(10px)",
              }}
            >
              <Link
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between py-4 text-[13px] font-semibold text-[#1A2B4A] hover:text-[#ff550c] active:text-[#ff550c] tracking-[0.15em] transition-[color,transform] active:scale-[0.97]"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* 하단 네비게이션 바 — fixed 제거, body flex 자식으로 항상 화면 하단 고정 */}
      {/* safe-area는 아래 별도 div로 처리 → 아이콘/텍스트가 nav 내 중앙 배치, 빈 gap 없음 */}
      <nav
        className="bg-white border-t border-gray-200 md:hidden flex-shrink-0"
        style={{ height: "64px" }}
      >
        <div className="flex h-full">

          {/* 메뉴 */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-[color,background-color,transform] active:scale-95 active:bg-gray-100 ${
              menuOpen ? "text-[#ff550c]" : "text-[#1A2B4A]"
            }`}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
            <span className="text-[11px] font-semibold leading-none tracking-tight">메뉴</span>
          </button>

          {/* 홈 */}
          <Link
            href="/"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#1A2B4A] touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            aria-label="홈"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
            </svg>
            <span className="text-[11px] font-semibold leading-none tracking-tight">홈</span>
          </Link>

          {/* 전체매장 */}
          <Link
            href="/store"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#1A2B4A] touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            aria-label="전체매장"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5h18" />
            </svg>
            <span className="text-[11px] font-semibold leading-none tracking-tight">전체매장</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
