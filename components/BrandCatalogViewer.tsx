"use client";
import { forwardRef, useRef, useState, useEffect } from "react";
import Link from "next/link";
import HTMLFlipBook from "react-pageflip";

export type BrandViewModel = {
  id: string;
  brand_name: string;
  cover: string;       // 표지 썸네일
  pages: string[];     // 페이지 이미지 URL (pg_1..N)
  pdf_url: string;     // 원본 PDF (대체 보기)
};

const FlipPage = forwardRef<HTMLDivElement, { src: string; alt: string }>(({ src, alt }, ref) => (
  <div ref={ref} className="bg-[#0d1826] w-full h-full overflow-hidden flex items-center justify-center">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} className="w-full h-full object-contain" loading="lazy" decoding="async" />
  </div>
));
FlipPage.displayName = "FlipPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Book = HTMLFlipBook as any;

// 타사 브랜드 PDF 카탈로그 뷰어 — 좌측(모바일 상단) 브랜드 목록 + 메인 플립북.
// 플립북은 사이드바를 제외한 '실제 가용 영역'에 맞춰 크기를 잡는다(window 기준 X).
export default function BrandCatalogViewer({ brands }: { brands: BrandViewModel[] }) {
  const [selectedId, setSelectedId] = useState(brands[0]?.id ?? "");
  const selected = brands.find((b) => b.id === selectedId) ?? brands[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0, portrait: false });

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => {
      const aw = el.clientWidth;
      const ah = el.clientHeight;
      const portrait = window.innerWidth < 768;
      const ratio = 1.414; // A4 세로
      let h = ah - 8;
      let w = Math.round(h / ratio);
      if (portrait) {
        if (w > aw - 16) { w = aw - 16; h = Math.round(w * ratio); }
      } else {
        if (w * 2 > aw - 24) { w = Math.floor((aw - 24) / 2); h = Math.round(w * ratio); }
      }
      setDims({ w: Math.max(80, w), h: Math.max(120, h), portrait });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { setCurrentPage(0); }, [selectedId]);

  if (!selected) return null;
  const total = selected.pages.length;

  return (
    <div className="flex flex-col md:flex-row bg-[#0d1826]" style={{ height: "calc(100vh - var(--wu-topbar-h, 36px) - 56px)" }}>
      {/* 브랜드 목록 (데스크탑 좌측 / 모바일 상단 가로 스크롤) */}
      <aside className="flex-shrink-0 md:w-[190px] border-b md:border-b-0 md:border-r border-white/10 overflow-x-auto md:overflow-y-auto">
        <div className="flex md:flex-col gap-2 p-3">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              style={{ minWidth: 64 }}
              className={`flex-shrink-0 md:w-full text-left rounded-lg overflow-hidden border transition-colors ${b.id === selectedId ? "border-[#ff550c]" : "border-white/10 hover:border-white/30"}`}
            >
              <div className="w-16 md:w-full aspect-[5/7] bg-[#303236] overflow-hidden">
                {b.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover} alt={b.brand_name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-[9px]">PDF</div>
                )}
              </div>
              <p className="text-[11px] text-white/80 px-1.5 py-1 truncate md:whitespace-normal md:leading-tight">{b.brand_name}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* 메인 뷰어 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <span className="text-white/80 text-sm font-medium truncate">{selected.brand_name}</span>
          {selected.pdf_url && (
            <a href={selected.pdf_url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#ff550c] text-xs whitespace-nowrap ml-3">원본 PDF ↗</a>
          )}
        </div>

        <div ref={areaRef} className="flex-1 flex items-center justify-center overflow-hidden px-2">
          {total > 0 && dims.w > 0 ? (
            <Book
              key={`${selectedId}-${dims.w}-${dims.portrait}`}
              ref={bookRef}
              width={dims.w}
              height={dims.h}
              usePortrait={dims.portrait}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onFlip={(e: any) => setCurrentPage(e.data)}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              size="fixed"
              minWidth={80}
              maxWidth={1200}
              minHeight={120}
              maxHeight={1800}
              drawShadow={true}
              flippingTime={700}
              useMouseEvents={true}
              clickEventForward={true}
              swipeDistance={30}
              showPageCorners={true}
            >
              {selected.pages.map((src, i) => (
                <FlipPage key={i} src={src} alt={`${selected.brand_name} ${i + 1}`} />
              ))}
            </Book>
          ) : total === 0 ? (
            // 페이지 변환 불가(또는 페이지수 0) → 원본 PDF 임베드, 없으면 안내
            selected.pdf_url ? (
              <iframe src={selected.pdf_url} className="w-full h-full bg-white rounded" title={selected.brand_name} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-6 gap-4">
                <p className="text-white/60 text-sm">미리보기를 준비 중입니다.</p>
                <div className="flex gap-3">
                  <Link href="/products" className="bg-[#ff550c] text-white text-xs tracking-widest px-5 py-2.5 hover:bg-[#d05518] transition-colors">제품 보기</Link>
                  <Link href="/store" className="border border-white/40 text-white text-xs tracking-widest px-5 py-2.5 hover:bg-white hover:text-[#303236] transition-colors">매장 찾기</Link>
                </div>
              </div>
            )
          ) : null}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-center gap-6 py-3 flex-shrink-0">
            <button onClick={() => bookRef.current?.pageFlip().flipPrev()} disabled={currentPage === 0}
              className="w-9 h-9 bg-[#303236] border border-[#243d5e] hover:border-[#ff550c] text-white text-xl flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed">‹</button>
            <span className="text-gray-500 text-[10px] tracking-widest w-16 text-center">{currentPage + 1} / {total}</span>
            <button onClick={() => bookRef.current?.pageFlip().flipNext()} disabled={currentPage >= total - 1}
              className="w-9 h-9 bg-[#303236] border border-[#243d5e] hover:border-[#ff550c] text-white text-xl flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed">›</button>
          </div>
        )}
      </div>
    </div>
  );
}
