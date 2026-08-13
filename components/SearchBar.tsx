"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type SearchConfig } from "@/lib/header-search";

// 메인·상품 목록 페이지 전용 전체 폭 검색행 — 배너(히어로) 바로 아래, 페이지 콘텐츠의 일부로 배치된다.
// (헤더에 고정되지 않고 페이지와 함께 스크롤된다.)
export default function SearchBar({ search }: { search: SearchConfig }) {
  const [searchQuery, setSearchQuery] = useState("");
  // 검색창 안내문구를 관리자가 등록한 여러 문구로 순환 노출 — 목록이 없으면 고정 placeholder를 그대로 쓴다.
  const [phraseIdx, setPhraseIdx] = useState(0);
  const router = useRouter();

  // 관리자가 고른 목록(프로모션 문구 vs 검색 키워드)만 순환 대상으로 삼는다.
  const rotationList = search.rotationSource === "display" ? search.displayPhrases : search.popularTerms;

  useEffect(() => {
    if (rotationList.length === 0) return;
    const id = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % rotationList.length);
    }, 3000);
    return () => clearInterval(id);
  }, [rotationList]);

  const rotatingPlaceholder = rotationList.length > 0
    ? rotationList[phraseIdx % rotationList.length]
    : search.placeholder;

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
  };

  if (!search.enabled) return null;

  return (
    <div className="bg-gray-50 py-3 md:py-4">
      <div className="px-[15px] md:px-[70px]">
        <div className="flex items-center h-12 bg-white border border-gray-300 rounded-lg px-4 shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={rotatingPlaceholder}
            aria-label="검색어 입력"
            className="flex-1 min-w-0 h-full text-[13px] leading-none text-gray-700 placeholder-gray-400 bg-transparent outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(searchQuery);
              if (e.key === "Escape") { setSearchQuery(""); e.currentTarget.blur(); }
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 text-sm px-2.5 flex-shrink-0"
              aria-label="검색어 지우기"
            >✕</button>
          )}
          <button
            onClick={() => handleSearch(searchQuery)}
            className="text-gray-500 hover:text-[#E5541B] transition-colors flex-shrink-0"
            aria-label="검색 실행"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
