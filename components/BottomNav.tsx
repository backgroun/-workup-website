"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DEFAULT_HEADER_NAV, type NavMenuItem } from "@/lib/header-nav";

const IC = "#666666";   // inactive color
const AC = "#ff550c";   // active color

function IconMenu({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

// 상품 아이콘 — 후드티 실루엣
function IconProducts() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {/* 칼라 사각형 */}
      <rect x="8" y="2" width="8" height="5" rx="1" />
      {/* 후드 V 형태 */}
      <path d="M10 2c-.5 2.5 2 4 2 4s2.5-1.5 2-4" />
      {/* 왼쪽 어깨·소매 */}
      <path d="M8 4C5.5 4 3 6 3 9v3h4" />
      {/* 오른쪽 어깨·소매 */}
      <path d="M16 4c2.5 0 5 2 5 5v3h-4" />
      {/* 몸통 */}
      <path d="M7 12h10v9a1 1 0 01-1 1H8a1 1 0 01-1-1z" />
      {/* 끈 */}
      <path d="M11 7v3M13 7v3" />
    </svg>
  );
}

// 매장 아이콘 — 쇼핑카트
function IconStore() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 001.96 1.58h9.59a2 2 0 001.95-1.57l1.54-7.43H5.12" />
    </svg>
  );
}

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
            className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            style={{ color: menuOpen ? AC : IC }}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            <IconMenu open={menuOpen} />
            <span className="text-[10px] font-semibold leading-none tracking-tight">메뉴</span>
          </button>

          {/* 홈 */}
          <Link
            href="/"
            className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            style={{ color: IC }}
            aria-label="홈"
            onClick={() => setMenuOpen(false)}
          >
            <IconHome />
            <span className="text-[10px] font-semibold leading-none tracking-tight">홈</span>
          </Link>

          {/* 상품 */}
          <Link
            href="/products"
            className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            style={{ color: IC }}
            aria-label="상품"
            onClick={() => setMenuOpen(false)}
          >
            <IconProducts />
            <span className="text-[10px] font-semibold leading-none tracking-tight">상품</span>
          </Link>

          {/* 매장 */}
          <Link
            href="/store"
            className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation transition-[background-color,transform] active:scale-95 active:bg-gray-100"
            style={{ color: IC }}
            aria-label="매장"
            onClick={() => setMenuOpen(false)}
          >
            <IconStore />
            <span className="text-[10px] font-semibold leading-none tracking-tight">매장</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
