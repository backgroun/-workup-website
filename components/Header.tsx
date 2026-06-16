"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Oxanium } from "next/font/google";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";


const oxanium = Oxanium({ subsets: ["latin"], weight: ["600"] });

const navItems = [
  { label: "PRODUCTS", href: "/products" },
  { label: "STORE", href: "/store" },
  { label: "STORY", href: "/story" },
  { label: "MATE", href: "/people" },
  { label: "FIELD TEST", href: "/field-test" },
];

const popularTerms = [
  "카고 팬츠", "방풍 자켓", "쿨링 티셔츠", "안전조끼", "롤업 셔츠", "멀티포켓",
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  // 모바일 상품 상세 페이지에서는 MobileProductNav가 대신 담당
  const hideOnMobile = /^\/products\/[^/]+$/.test(pathname ?? "");

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className={`sticky top-9 z-50 bg-white border-b border-gray-200${hideOnMobile ? " hidden md:block" : ""}`}>
      <div className="px-[15px] md:px-[70px]">
        <div className="flex items-center justify-between h-14">

          {/* 로고 */}
          <Link href="/" className="flex-shrink-0 py-2">
            <Image src="/images/logo_black.png" alt="WORKUP" width={130} height={18} className="h-[14px] w-[100px] md:h-[18px] md:w-[130px]" priority />
          </Link>

          {/* 데스크탑 내비게이션 */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-start ml-[60px]">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${oxanium.className} text-[17px] text-[#1A2B4A] hover:text-[#ff550c] transition-colors tracking-wide whitespace-nowrap`}
                style={{ fontWeight: 650 }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측 아이콘 */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* 검색 */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
              className="p-1 text-[#1A2B4A] hover:text-[#ff550c] transition-colors"
              aria-label="검색"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>

            {/* 찜 목록 */}
            <Link href="/cart" className="relative p-1 text-[#1A2B4A] hover:text-[#ff550c] transition-colors" aria-label="찜 목록">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ff550c] text-white text-[10px] font-bold flex items-center justify-center rounded-full px-0.5">
                  {count}
                </span>
              )}
            </Link>

            {/* 회원가입 */}
            <Link href="/register" className="p-1 text-[#1A2B4A] hover:text-[#ff550c] transition-colors" aria-label="회원가입">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            </Link>

          </div>
        </div>

        {/* 검색 패널 */}
        {searchOpen && (
          <div className="border-t border-gray-200 py-3">
            {/* 검색 입력 */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요"
                autoFocus
                className="flex-1 text-[14px] text-[#1A2B4A] placeholder-gray-400 bg-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(searchQuery);
                  if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1"
                >✕</button>
              )}
              <button
                onClick={() => handleSearch(searchQuery)}
                className="text-[#1A2B4A] hover:text-[#ff550c] transition-colors flex-shrink-0"
                aria-label="검색 실행"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </button>
            </div>

            {/* 인기 검색어 */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[11px] text-gray-400 tracking-wide flex-shrink-0">인기검색어</span>
              {popularTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="text-[11px] text-gray-600 bg-gray-100 hover:bg-[#ff550c] hover:text-white px-2.5 py-1 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </header>
  );
}
