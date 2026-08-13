"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CatEntry = { main: string; sub: string };

// 제품 상세 데스크탑 브레드크럼 — 카테고리가 여러 개 등록된 제품은 대표 카테고리만 먼저 보여주고
// "+N개 카테고리" 토글로 나머지를 펼쳐볼 수 있게 한다.
export default function ProductBreadcrumb({ cats }: { cats: CatEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [primary, ...rest] = cats;

  if (!primary) return null;

  const catHref = (c: CatEntry) =>
    `/products?category=${encodeURIComponent(c.main)}${c.sub ? `&sub=${encodeURIComponent(c.sub)}` : ""}`;

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <nav className="max-w-screen-2xl mx-auto px-8 py-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-400 tracking-wide">
      <Link href="/products" className="hover:text-gray-600 transition-colors whitespace-nowrap">전체 제품</Link>
      <span className="flex-shrink-0">/</span>
      <Link href={catHref(primary)} className="hover:text-gray-600 transition-colors whitespace-nowrap">
        {primary.main}
        {primary.sub && <span className="text-gray-300"> / {primary.sub}</span>}
      </Link>
      {rest.length > 0 && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap">
          +{rest.length}개 카테고리
          <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {expanded && rest.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 basis-full">
          {rest.map((c, i) => (
            <Link key={`${c.main}-${c.sub}-${i}`} href={catHref(c)}
              className="px-2 py-0.5 border border-gray-200 rounded-full hover:border-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap">
              {c.main}{c.sub && ` / ${c.sub}`}
            </Link>
          ))}
        </div>
      )}

      {/* 검색 — PC 전용, 박스 없이 밑줄만, 카테고리 행 오른쪽 끝에 정렬 */}
      <div className="hidden md:flex items-center gap-2 ml-auto flex-shrink-0 border-b border-gray-300 pb-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
          aria-label="검색어 입력"
          className="w-48 text-[12px] text-gray-600 bg-transparent outline-none"
        />
        <button type="button" onClick={submitSearch} aria-label="검색 실행"
          className="text-gray-400 hover:text-[#E5541B] transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
