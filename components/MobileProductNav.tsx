"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function MobileProductNav() {
  const router = useRouter();
  const { count } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <div className="md:hidden sticky z-50 bg-white border-b border-gray-200 flex items-center justify-between px-5 h-12" style={{ top: "var(--wu-topbar-h, 36px)" }}>
      <div className="flex items-center gap-5 flex-shrink-0">
        <button onClick={() => router.back()} aria-label="뒤로 가기" className="text-gray-700 hover:text-[#303236] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 돋보기를 누르면 페이지 이동 대신 검색창이 왼쪽 공간으로 열려 바로 검색할 수 있다 */}
      {searchOpen && (
        <div className="flex-1 mx-3 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=""
            aria-label="검색어 입력"
            className="w-full text-gray-600 placeholder-gray-400 bg-transparent outline-none border-b border-gray-300 focus:border-[#303236] py-1 transition-colors"
            style={{ fontSize: "16px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
              if (e.key === "Escape") closeSearch();
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-5 flex-shrink-0">
        {searchOpen ? (
          <>
            <button onClick={submitSearch} aria-label="검색 실행" className="text-gray-700 hover:text-[#303236] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button onClick={closeSearch} aria-label="검색 닫기" className="text-gray-700 hover:text-[#303236] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setSearchOpen(true)} aria-label="제품 검색" className="text-gray-700 hover:text-[#303236] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link href="/cart" aria-label="찜 목록" className="relative text-gray-700 hover:text-[#303236] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#E5541B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
