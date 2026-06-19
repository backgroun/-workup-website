"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Oxanium } from "next/font/google";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { DEFAULT_HEADER_NAV, type NavMenuItem } from "@/lib/header-nav";
import { DEFAULT_LOGO, type LogoConfig } from "@/lib/logo";
import { DEFAULT_SEARCH, type SearchConfig } from "@/lib/header-search";


const oxanium = Oxanium({ subsets: ["latin"], weight: ["600"] });

const POPULAR_VISIBLE = 4;

type MemberSession = { name: string; grade: string } | null;

export default function Header({
  navItems = DEFAULT_HEADER_NAV.items,
  logo = DEFAULT_LOGO,
  search = DEFAULT_SEARCH,
  studioEnabled = true,
}: {
  navItems?: NavMenuItem[];
  logo?: LogoConfig;
  search?: SearchConfig;
  studioEnabled?: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [termIndex, setTermIndex] = useState(0);
  const [memberSession, setMemberSession] = useState<MemberSession>(undefined as unknown as MemberSession);
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  // 모바일 상품 상세 페이지에서는 MobileProductNav가 대신 담당
  const hideOnMobile = /^\/products\/[^/]+$/.test(pathname ?? "");

  useEffect(() => {
    fetch("/api/member/me")
      .then(r => r.json())
      .then(data => setMemberSession(data ?? null))
      .catch(() => setMemberSession(null));
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen || search.popularTerms.length === 0) return;
    setTermIndex(Math.floor(Math.random() * search.popularTerms.length));
  }, [searchOpen, search.popularTerms.length]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header
      className={`sticky z-50 bg-white border-b border-gray-200${hideOnMobile ? " hidden md:block" : ""}`}
      style={{ top: "var(--wu-topbar-h, 36px)" }}
    >
      <div className="px-[15px] md:px-[70px]">
        <div className="flex items-center justify-between h-14">

          {/* 로고 */}
          <Link href="/" className="flex-shrink-0 py-2 active:opacity-50 active:scale-95 transition-[opacity,transform] duration-150">
            <Image src={logo.src} alt={logo.alt} width={130} height={18} className="h-[14px] w-[100px] md:h-[18px] md:w-[130px]" priority />
          </Link>

          {/* 데스크탑 내비게이션 */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-start ml-[60px]">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noopener noreferrer" : undefined}
                className={`${oxanium.className} text-[17px] text-[#1A2B4A] hover:text-[#ff550c] transition-colors tracking-wide whitespace-nowrap`}
                style={{ fontWeight: 650 }}
              >
                {item.label}
              </Link>
            ))}

            {/* 티셔츠 꾸미기 스튜디오 — 관리자에서 활성화 시 노출 */}
            {studioEnabled && (
              <Link
                href="/studio"
                className={`${oxanium.className} flex items-center gap-1.5 text-[15px] text-white bg-[#ff550c] hover:brightness-95 px-3.5 py-1.5 rounded-full transition tracking-wide whitespace-nowrap shadow-sm`}
                style={{ fontWeight: 650 }}
              >
                STUDIO
                <span className="text-[9px] font-bold leading-none bg-white text-[#ff550c] rounded-full px-1 py-[3px]">NEW</span>
              </Link>
            )}
          </nav>

          {/* 우측 아이콘 */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* 검색 */}
            {search.enabled && (
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
            )}

            {/* 찜 목록 — 비로그인 시 로그인 유도 */}
            <button
              onClick={() => { memberSession ? router.push("/cart") : router.push("/member/login?from=cart"); }}
              className="relative p-1 text-[#1A2B4A] hover:text-[#ff550c] transition-colors"
              aria-label="찜 목록"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ff550c] text-white text-[10px] font-bold flex items-center justify-center rounded-full px-0.5">
                  {count}
                </span>
              )}
            </button>

            {/* 회원 버튼: 로그인 여부에 따라 마이페이지 / 로그인 */}
            <Link
              href={memberSession ? "/mypage" : "/member/login"}
              className="relative p-1 text-[#1A2B4A] hover:text-[#ff550c] transition-colors"
              aria-label={memberSession ? "마이페이지" : "로그인"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
              {/* 로그인 상태 표시 점 */}
              {memberSession && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#ff550c] rounded-full" />
              )}
            </Link>

          </div>
        </div>

        {/* 검색 패널 */}
        {searchOpen && search.enabled && (
          <div className="border-t border-gray-200 py-3">
            {/* 검색 입력 */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={search.placeholder}
                autoFocus
                className="flex-1 text-[14px] text-[#1A2B4A] placeholder-gray-400 bg-transparent outline-none"
                style={{ fontSize: "16px" }}
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
            <div className="flex items-center gap-2 mt-3 overflow-hidden">
              {search.popularTerms.length > 0 && Array.from(
                { length: Math.min(POPULAR_VISIBLE, search.popularTerms.length) },
                (_, i) => search.popularTerms[(termIndex + i) % search.popularTerms.length]
              ).map((term, idx) => (
                <button
                  key={`${term}-${idx}`}
                  onClick={() => handleSearch(term)}
                  className="text-[11px] text-gray-600 bg-gray-100 hover:bg-[#ff550c] hover:text-white px-2.5 py-1 transition-colors flex-shrink-0"
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
