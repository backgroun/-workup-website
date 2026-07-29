"use client";
import { useState } from "react";
import Link from "next/link";

type CatEntry = { main: string; sub: string };

// 제품 상세 데스크탑 브레드크럼 — 카테고리가 여러 개 등록된 제품은 대표 카테고리만 먼저 보여주고
// "+N개 카테고리" 토글로 나머지를 펼쳐볼 수 있게 한다.
export default function ProductBreadcrumb({ cats }: { cats: CatEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const [primary, ...rest] = cats;

  if (!primary) return null;

  const catHref = (c: CatEntry) =>
    `/products?category=${encodeURIComponent(c.main)}${c.sub ? `&sub=${encodeURIComponent(c.sub)}` : ""}`;

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
    </nav>
  );
}
