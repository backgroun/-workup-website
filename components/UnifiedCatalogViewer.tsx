"use client";
import { forwardRef, useRef, useState, useEffect } from "react";
import Link from "next/link";
import HTMLFlipBook from "react-pageflip";
import type { CatalogPage } from "@/data/catalog";
import CatalogPageView from "./CatalogPageView";

export type BrandEntry = { id: string; name: string; cover: string; pages: string[]; pdf_url: string };

const FlipPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="bg-[#0d1826] w-full h-full overflow-hidden">{children}</div>
));
FlipPage.displayName = "FlipPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Book = HTMLFlipBook as any;

// WORKUP 카탈로그 + 타사 브랜드 카탈로그를 한 화면에. 우측 표지 썸네일로 전환.
export default function UnifiedCatalogViewer({ workupPages, brands }: { workupPages: CatalogPage[]; brands: BrandEntry[] }) {
  const [selectedId, setSelectedId] = useState(workupPages.length > 0 ? "workup" : (brands[0]?.id ?? "workup"));
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
      const ratio = 1.4;
      let h = ah - 8;
      let w = Math.round(h / ratio);
      if (portrait) {
        // 모바일: 전체 너비 사용, 화살표는 이미지 위 오버레이
        w = aw;
        h = Math.round(w * ratio);
        if (h > ah - 8) { h = ah - 8; w = Math.round(h / ratio); }
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

  const isWorkup = selectedId === "workup";
  const brand = brands.find((b) => b.id === selectedId);
  const pageNodes: React.ReactNode[] = isWorkup
    ? workupPages.map((p) => <CatalogPageView key={p.id} page={p} />)
    : (brand?.pages ?? []).map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={url} alt="" className="w-full h-full object-contain bg-[#0d1826]" loading="lazy" decoding="async" />
      ));
  const total = pageNodes.length;
  const pdfUrl = isWorkup ? "" : (brand?.pdf_url ?? "");
  const workupCover = workupPages[0];
  const showSidebar = brands.length > 0;

  return (
    <div className="bg-[#0d1826] flex flex-col overflow-hidden" style={{ height: "calc(100vh - var(--wu-topbar-h, 36px) - 56px - var(--wu-bottom-nav-h, 0px))" }}>
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
      {/* 메인 뷰어 */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col order-1">

        {/* 모바일 상단 바 */}
        <div className="md:hidden flex items-center bg-neutral-900 border-b border-white/10 flex-shrink-0 mt-1">
          {total > 0 && (
            <button
              onClick={() => bookRef.current?.pageFlip().flip(0)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-white/60 hover:text-white/90 transition-colors active:bg-white/5"
              aria-label="표지로 이동"
            >
              <span className="text-sm leading-none">📖</span>
              <span className="text-xs font-medium tracking-wide">표지</span>
            </button>
          )}
          <span className="text-white/20 text-xs select-none">|</span>
          <Link href="/" className="flex items-center gap-1.5 px-4 py-2.5 text-white/60 hover:text-white/90 transition-colors active:bg-white/5">
            <span className="text-sm leading-none">🏠</span>
            <span className="text-xs font-medium tracking-wide">홈으로</span>
          </Link>
          {total > 1 && (
            <span className="ml-auto text-white/30 text-[10px] tracking-widest pr-4">{currentPage + 1} / {total}</span>
          )}
        </div>

        <div ref={areaRef} className="relative flex-1 flex items-center justify-center overflow-hidden px-0 md:px-1">
          {total > 0 && dims.w > 0 ? (
            <>
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
                minWidth={80} maxWidth={1200} minHeight={120} maxHeight={1800}
                drawShadow={true} flippingTime={700}
                useMouseEvents={!dims.portrait}
                clickEventForward={!dims.portrait}
                swipeDistance={dims.portrait ? 9999 : 30}
                showPageCorners={!dims.portrait}
              >
                {pageNodes.map((node, i) => <FlipPage key={i}>{node}</FlipPage>)}
              </Book>
              {/* 모바일 전용 좌우 화살표 — 이미지 위 오버레이 */}
              {dims.portrait && total > 1 && (
                <>
                  <button
                    onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    disabled={currentPage === 0}
                    aria-label="이전 페이지"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-10 h-16 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white transition-opacity duration-200 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => bookRef.current?.pageFlip().flipNext()}
                    disabled={currentPage >= total - 1}
                    aria-label="다음 페이지"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-10 h-16 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white transition-opacity duration-200 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </>
          ) : !isWorkup && total === 0 && pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full bg-white rounded" title={brand?.name} />
          ) : (
            <p className="text-white/30 text-xs tracking-widest">준비 중입니다</p>
          )}
        </div>

        {/* 데스크탑 하단 바 */}
        <div className="hidden md:flex items-center justify-center gap-3 py-2 flex-shrink-0">
          <Link href="/" className="w-8 h-8 bg-[#1A2B4A] border border-[#243d5e] hover:border-[#ff550c] text-white/70 hover:text-white flex items-center justify-center transition-colors" aria-label="메인으로">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          {total > 1 && (
            <>
              <button onClick={() => bookRef.current?.pageFlip().flipPrev()} disabled={currentPage === 0}
                className="w-8 h-8 bg-[#1A2B4A] border border-[#243d5e] hover:border-[#ff550c] text-white text-lg flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed">‹</button>
              <span className="text-gray-500 text-[10px] tracking-widest w-14 text-center">{currentPage + 1} / {total}</span>
              <button onClick={() => bookRef.current?.pageFlip().flipNext()} disabled={currentPage >= total - 1}
                className="w-8 h-8 bg-[#1A2B4A] border border-[#243d5e] hover:border-[#ff550c] text-white text-lg flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed">›</button>
            </>
          )}
        </div>
      </div>

      {/* 우측 표지 썸네일 네비 (브랜드가 있을 때만) */}
      {showSidebar && (
        <aside className="flex-shrink-0 order-2 md:w-[150px] border-t md:border-t-0 md:border-l border-white/10 overflow-x-auto md:overflow-y-auto bg-[#0d1826]">
          <div className="flex md:flex-col gap-3 p-3 md:py-5">
            {/* WORKUP */}
            <CoverThumb name="WORKUP" active={isWorkup} onClick={() => setSelectedId("workup")}>
              {workupCover ? <ScaledCover page={workupCover} /> : <div className="w-full h-full bg-[#1A2B4A] flex items-center justify-center text-white/40 text-[10px] font-bold">WORKUP</div>}
            </CoverThumb>
            {/* 타사 브랜드 */}
            {brands.map((b) => (
              <CoverThumb key={b.id} name={b.name} active={b.id === selectedId} onClick={() => setSelectedId(b.id)}>
                {b.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
                ) : <div className="w-full h-full bg-[#1A2B4A] flex items-center justify-center text-white/30 text-[9px]">PDF</div>}
              </CoverThumb>
            ))}
          </div>
        </aside>
      )}
      </div>

    </div>
  );
}

// 썸네일 버튼 — 현재 보는 카탈로그는 흑백, 나머지는 컬러로 구분(요청 사양). 선택 표시는 주황 테두리.
function CoverThumb({ name, active, onClick, children }: { name: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="block flex-shrink-0 w-[64px] md:w-full group">
      <div
        className={`relative w-full overflow-hidden rounded border-2 transition-all ${active ? "border-[#ff550c]" : "border-transparent group-hover:border-white/30"}`}
        style={{ aspectRatio: "5 / 7", filter: active ? "grayscale(1)" : "none" }}
      >
        {children}
      </div>
      <p className={`text-[11px] text-center mt-1 truncate ${active ? "text-[#ff550c] font-semibold" : "text-white/60 group-hover:text-white/90"}`}>{name}</p>
    </button>
  );
}

// 표지(고정 px 디자인)를 작은 썸네일 크기에 맞춰 축소 렌더.
function ScaledCover({ page }: { page: CatalogPage }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.34);
  const BASE = 260;
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / BASE);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden">
      <div style={{ width: BASE, height: Math.round(BASE * 1.4), transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <CatalogPageView page={page} />
      </div>
    </div>
  );
}
