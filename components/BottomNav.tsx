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
      {/* 백드롭 */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[58] bg-black/50 transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* 바텀시트 */}
      <div
        className="fixed left-0 right-0 z-[59] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out md:hidden"
        style={{
          bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
          transform: menuOpen ? "translateY(0)" : "translateY(110%)",
        }}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex justify-center pt-3.5 pb-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>
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
        <nav className="px-6 pb-4 pt-1">
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

      {/* 하단 네비게이션 바 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 md:hidden"
        style={{
          height: "calc(64px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex h-full">

          {/* 메뉴 */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-[color,background-color,transform] active:scale-95 active:bg-gray-100 ${
              menuOpen ? "text-[#ff550c]" : "text-[#666666]"
            }`}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
            <span className="text-[10px] font-semibold leading-none tracking-tight">메뉴</span>
          </button>

          {/* 홈 */}
          <Link
            href="/"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#666666] touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            aria-label="홈"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
            </svg>
            <span className="text-[10px] font-semibold leading-none tracking-tight">홈</span>
          </Link>

          {/* 상품 */}
          <Link
            href="/products"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#666666] touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            aria-label="상품"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
            </svg>
            <span className="text-[10px] font-semibold leading-none tracking-tight">상품</span>
          </Link>

          {/* 매장 */}
          <Link
            href="/store"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#666666] touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            aria-label="매장"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <span className="text-[10px] font-semibold leading-none tracking-tight">매장</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
