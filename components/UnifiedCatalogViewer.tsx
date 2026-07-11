"use client";
import { forwardRef, useRef, useState, useEffect } from "react";
import Link from "next/link";
import HTMLFlipBook from "react-pageflip";
import type { CatalogPage } from "@/data/catalog";
import CatalogPageView from "./CatalogPageView";
import { ikResize } from "@/lib/image-url";

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
  const [showToc, setShowToc] = useState(false);

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
        <img key={i} src={ikResize(url, 1200)} alt="" className="w-full h-full object-contain bg-[#0d1826]" loading="lazy" decoding="async" />
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
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-white/60 hover:text-white/90 transition-colors active:bg-white/5"
              aria-label="표지로 이동"
            >
              {/* 책 라인 아이콘 */}
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" />
              </svg>
              <span className="text-xs font-medium tracking-wide">표지</span>
            </button>
          )}
          <span className="text-white/15 text-xs select-none">|</span>
          <Link href="/" className="flex items-center gap-1.5 px-3.5 py-2.5 text-white/60 hover:text-white/90 transition-colors active:bg-white/5">
            {/* 홈 라인 아이콘 */}
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-xs font-medium tracking-wide">홈으로</span>
          </Link>
          {total > 1 && (
            <>
              <span className="text-white/15 text-xs select-none">|</span>
              <button
                onClick={() => setShowToc(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-white/60 hover:text-white/90 transition-colors active:bg-white/5"
                aria-label="목차 보기"
              >
                {/* 목차 라인 아이콘 */}
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="text-xs font-medium tracking-wide">목차</span>
              </button>
            </>
          )}
          {total > 1 && (
            <span className="ml-auto text-white/30 text-[10px] tracking-widest pr-3">{currentPage + 1} / {total}</span>
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
              {/* 모바일 전용 좌우 화살표 — 양쪽 엣지 오버레이 */}
              {dims.portrait && total > 1 && (
                <>
                  <button
                    onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    disabled={currentPage === 0}
                    aria-label="이전 페이지"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-16 flex items-center justify-center transition-opacity duration-200 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <svg className="w-5 h-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => bookRef.current?.pageFlip().flipNext()}
                    disabled={currentPage >= total - 1}
                    aria-label="다음 페이지"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-16 flex items-center justify-center transition-opacity duration-200 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <svg className="w-5 h-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
          <Link href="/" className="w-8 h-8 bg-[#303236] border border-[#243d5e] hover:border-[#E5541B] text-white/70 hover:text-white flex items-center justify-center transition-colors" aria-label="메인으로">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          {total > 1 && (
            <>
              <button onClick={() => bookRef.current?.pageFlip().flipPrev()} disabled={currentPage === 0}
                className="w-8 h-8 bg-[#303236] border border-[#243d5e] hover:border-[#E5541B] text-white text-lg flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed">‹</button>
              <span className="text-gray-500 text-[10px] tracking-widest w-14 text-center">{currentPage + 1} / {total}</span>
              <button onClick={() => bookRef.current?.pageFlip().flipNext()} disabled={currentPage >= total - 1}
                className="w-8 h-8 bg-[#303236] border border-[#243d5e] hover:border-[#E5541B] text-white text-lg flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed">›</button>
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
              {workupCover ? <ScaledCover page={workupCover} /> : <div className="w-full h-full bg-[#303236] flex items-center justify-center text-white/40 text-[10px] font-bold">WORKUP</div>}
            </CoverThumb>
            {/* 타사 브랜드 */}
            {brands.map((b) => (
              <CoverThumb key={b.id} name={b.name} active={b.id === selectedId} onClick={() => setSelectedId(b.id)}>
                {b.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ikResize(b.cover, 300)} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
                ) : <div className="w-full h-full bg-[#303236] flex items-center justify-center text-white/30 text-[9px]">PDF</div>}
              </CoverThumb>
            ))}
          </div>
        </aside>
      )}
      </div>

      {/* 모바일 목차 바텀시트 */}
      {showToc && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[70] bg-black/40"
            onClick={() => setShowToc(false)}
            aria-hidden="true"
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[71] bg-white rounded-t-2xl shadow-xl overflow-hidden"
            style={{ maxHeight: "65vh" }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">목차</p>
              <button onClick={() => setShowToc(false)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="닫기">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(65vh - 56px)" }}>
              <div className="grid grid-cols-5 gap-2 p-4">
                {Array.from({ length: total }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      bookRef.current?.pageFlip().flip(i);
                      setCurrentPage(i);
                      setShowToc(false);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      i === currentPage
                        ? "bg-[#E5541B] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 썸네일 버튼 — 현재 보는 카탈로그는 흑백, 나머지는 컬러로 구분(요청 사양). 선택 표시는 주황 테두리.
function CoverThumb({ name, active, onClick, children }: { name: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="block flex-shrink-0 w-[64px] md:w-full group">
      <div
        className={`relative w-full overflow-hidden rounded border-2 transition-all ${active ? "border-[#E5541B]" : "border-transparent group-hover:border-white/30"}`}
        style={{ aspectRatio: "5 / 7", filter: active ? "grayscale(1)" : "none" }}
      >
        {children}
      </div>
      <p className={`text-[11px] text-center mt-1 truncate ${active ? "text-[#E5541B] font-semibold" : "text-white/60 group-hover:text-white/90"}`}>{name}</p>
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
