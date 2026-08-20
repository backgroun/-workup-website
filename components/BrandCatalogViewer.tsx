"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

import type { BrandTocItem } from "@/types/catalog";
export type { BrandTocItem } from "@/types/catalog";

type Props = {
  pdfUrl: string;
  pageCount: number;
  brandName: string;
  accentColor: string;
  toc?: BrandTocItem[];
};

const A4_RATIO = 297 / 210;

function spreadOf(pageIdx: number) { return Math.ceil(pageIdx / 2); }
function pagesOfSpread(s: number, total: number) {
  if (s === 0) return { left: -1, right: Math.min(0, total - 1) };
  const l = s * 2 - 1, r = s * 2;
  return { left: l < total ? l : -1, right: r < total ? r : -1 };
}

function PageSkeleton({ w, h }: { w: number; h: number }) {
  return (
    <div style={{ width: w, height: h, backgroundColor: "#e8e4de", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #ccc5bb", borderTopColor: "#888", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const SCROLLBAR_CSS = `
.bcv-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
}
.bcv-area::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.bcv-area::-webkit-scrollbar-track {
  background: transparent;
}
.bcv-area::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.18);
  border-radius: 100px;
}
.bcv-area::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.32);
}
.bcv-area::-webkit-scrollbar-corner {
  background: transparent;
}
`;

export default function BrandCatalogViewer({ pdfUrl, pageCount, brandName, accentColor, toc = [] }: Props) {
  const [spread, setSpread] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0, vw: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);   // 크기 측정용 (overflow: hidden)
  const scrollRef = useRef<HTMLDivElement>(null); // 스크롤 + 드래그용 (overflow: auto)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: 0 });

  const total = pageCount;
  const totalSpreads = total === 0 ? 0 : Math.ceil(total / 2);
  const { left: leftIdx, right: rightIdx } = pagesOfSpread(spread, total);
  const isSpread = !portrait && spread > 0 && leftIdx >= 0;
  const maxSpread = portrait ? total - 1 : totalSpreads - 1;
  const canPrev = spread > 0;
  const canNext = spread < maxSpread;
  const currentPage = portrait ? spread : (rightIdx >= 0 ? rightIdx : leftIdx >= 0 ? leftIdx : 0);
  const pageDisplay = isSpread && leftIdx >= 0 && rightIdx >= 0
    ? `${leftIdx + 1} — ${rightIdx + 1}`
    : `${currentPage + 1}`;

  const zoomedW = Math.round(dims.w * zoom);
  const zoomedH = Math.round(dims.h * zoom);

  const calcDims = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    const isPort = window.innerWidth < 768;
    setPortrait(isPort);
    const aw = el.clientWidth;
    const ah = el.clientHeight;
    let w: number, h: number;
    if (isPort) {
      w = Math.max(80, aw - 16);
      h = Math.round(w * A4_RATIO);
      if (h > ah - 16) { h = Math.max(120, ah - 16); w = Math.round(h / A4_RATIO); }
    } else {
      h = Math.max(120, ah - 32);
      w = Math.round(h / A4_RATIO);
      const maxW = Math.max(80, Math.floor((aw - 48) / 2));
      if (w > maxW) { w = maxW; h = Math.round(w * A4_RATIO); }
    }
    setDims({ w, h, vw: aw });
  }, []);

  useEffect(() => {
    calcDims();
    const ro = new ResizeObserver(calcDims);
    if (areaRef.current) ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, [calcDims]);

  // 터치 드래그 — scrollRef(overflow:auto)에 직접 부착 (passive: false 필요)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startX = 0, startY = 0, startSL = 0, startST = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      startSL = el.scrollLeft; startST = el.scrollTop;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
      e.preventDefault();
      const t = e.touches[0];
      el.scrollLeft = startSL - (t.clientX - startX);
      el.scrollTop = startST - (t.clientY - startY);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // 마우스 드래그 (PC)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
      moved: 0,
    };
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.moved = Math.sqrt(dx * dx + dy * dy);
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
    scrollRef.current.scrollTop = dragRef.current.scrollTop - dy;
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDrag = dragRef.current.moved > 5;
    dragRef.current.active = false;
    dragRef.current.moved = 0;
    setIsDragging(false);
    // 드래그가 아닌 클릭이면 → 위치 기반 페이지 이동
    if (!wasDrag && zoom <= 1 && scrollRef.current) {
      const rect = scrollRef.current.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (e.clientX < mid) {
        setSpread((s) => Math.max(0, s - 1));
      } else {
        setSpread((s) => Math.min(maxSpread, s + 1));
      }
    }
  }, [zoom, maxSpread]);

  const onMouseLeave = useCallback(() => {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      dragRef.current.moved = 0;
      setIsDragging(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const activeTocIdx = toc.length > 0
    ? toc.reduce((acc, item, i) => item.page - 1 <= currentPage ? i : acc, -1)
    : -1;

  const pageBoxStyle: React.CSSProperties = {
    width: zoomedW,
    height: zoomedH,
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#ede8e0",
  };

  const renderPage = (pageNum: number) => {
    if (pageNum < 0 || pageNum >= total) return null;
    return (
      <Page
        pageNumber={pageNum + 1}
        width={zoomedW}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={<PageSkeleton w={zoomedW} h={zoomedH} />}
        error={<PageSkeleton w={zoomedW} h={zoomedH} />}
      />
    );
  };

  const isZoomedIn = zoom > 1;
  const cursorStyle = isDragging ? "grabbing" : isZoomedIn ? "grab" : "pointer";

  return (
    <div ref={containerRef} className="flex overflow-hidden select-none"
      style={{ height: isFullscreen ? "100vh" : "80vh", backgroundColor: "#F0F0F0" }}>
      <style>{SCROLLBAR_CSS}</style>

      {/* ── TOC 사이드바 ── */}
      {toc.length > 0 && !portrait && (
        <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-[9px] tracking-[0.3em] font-bold uppercase" style={{ color: accentColor }}>CONTENTS</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <ul className="px-2.5 space-y-0.5">
              {toc.map((item, i) => {
                const isActive = i === activeTocIdx;
                return (
                  <li key={i}>
                    <button onClick={() => setSpread(spreadOf(Math.max(0, item.page - 1)))}
                      className={`w-full flex items-start gap-3 py-2.5 px-2 text-left rounded-lg transition-colors ${isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                      <span className="flex-shrink-0 text-[10px] font-bold tabular-nums w-5 mt-0.5"
                        style={{ color: isActive ? accentColor : "#d1d5db" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold tracking-widest ${isActive ? "text-gray-900" : "text-gray-400"}`}>{item.label}</p>
                        {item.labelKo && <p className={`text-[10px] mt-0.5 ${isActive ? "text-gray-500" : "text-gray-300"}`}>{item.labelKo}</p>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      )}

      {/* ── 뷰어 + 하단 컨트롤 ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* 메인 뷰어 — 3중 레이어: [크기측정] → [스크롤+드래그] → [중앙정렬] */}

        {/* 1) 크기 측정용 (overflow: hidden으로 스크롤바가 calcDims를 오염시키지 않게) */}
        <div ref={areaRef} style={{ flex: 1, minHeight: 0, overflow: "hidden", background: "#F0F0F0" }}>

          {/* 2) 스크롤 + 드래그 레이어 */}
          <div
            ref={scrollRef}
            className="bcv-area"
            style={{ width: "100%", height: "100%", overflow: zoom > 1 ? "auto" : "hidden", cursor: cursorStyle, userSelect: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={(e) => onMouseUp(e)}
            onMouseLeave={onMouseLeave}
          >
            {/* 3) 중앙정렬 래퍼
                 padding으로 중앙정렬: 콘텐츠가 작으면 padding이 여백을 채워 중앙에 위치,
                 콘텐츠가 커서 오버플로 되면 padding이 최솟값(16)으로 줄어들고
                 양방향 스크롤이 정상 동작 (justifyContent:center는 왼쪽 스크롤 막힘) */}
            <div style={(() => {
              const spreadW = !portrait && leftIdx >= 0 ? zoomedW * 2 : zoomedW;
              const hPad = Math.max(16, Math.floor((dims.vw - spreadW) / 2));
              return { padding: `16px ${hPad}px` };
            })()}>
              {total > 0 && dims.w > 0 && (
                <Document
                  file={pdfUrl}
                  loading={
                    <div style={{ display: "flex" }}>
                      {!portrait && <PageSkeleton w={zoomedW} h={zoomedH} />}
                      <PageSkeleton w={zoomedW} h={zoomedH} />
                    </div>
                  }
                  error={
                    <div style={{ color: "#c0392b", fontSize: 14, textAlign: "center", padding: 24 }}>
                      PDF 로딩 실패<br />
                      <span style={{ fontSize: 12, color: "#888" }}>{brandName} 카탈로그를 불러올 수 없습니다.</span>
                    </div>
                  }
                >
                  <div style={{
                    display: "flex",
                    position: "relative",
                    flexShrink: 0,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
                  }}>
                    {/* 왼쪽 페이지 — leftIdx >= 0일 때만 렌더 (spread 0 = 표지는 단면) */}
                    {!portrait && leftIdx >= 0 && (
                      <div style={pageBoxStyle}>
                        {renderPage(leftIdx)}
                        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to right, transparent 72%, rgba(0,0,0,0.10) 100%)" }} />
                      </div>
                    )}
                    {/* 오른쪽 / 단독 페이지 */}
                    <div style={pageBoxStyle}>
                      {renderPage(portrait ? spread : rightIdx)}
                      {!portrait && leftIdx >= 0 && (
                        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to left, transparent 72%, rgba(0,0,0,0.10) 100%)" }} />
                      )}
                    </div>
                    {isSpread && (
                      <div style={{
                        position: "absolute", top: 0, left: zoomedW - 1, width: 2, height: "100%",
                        background: "linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.18))",
                        pointerEvents: "none", zIndex: 4,
                      }} />
                    )}
                  </div>
                </Document>
              )}
            </div>
          </div>
        </div>

        {/* ── 하단 컨트롤 바 ── */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          height: 44,
          backgroundColor: "#F0F0F0",
          borderTop: "1px solid #DCDCDC",
        }}>

          {/* 줌 컨트롤 — 모바일/PC 모두 */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setZoom(z => Math.max(1.0, parseFloat((z - 0.2).toFixed(1))))}
              disabled={zoom <= 1.0}
              style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                color: zoom <= 1.0 ? "#BCBCBC" : "#2e2e2e",
                fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: zoom <= 1.0 ? "default" : "pointer",
                borderRadius: 6, transition: "color 0.15s",
              }}
            >−</button>
            {/* 슬라이더 — PC만 */}
            <input
              type="range" min={100} max={300} step={20}
              value={Math.round(zoom * 100)}
              onChange={e => setZoom(Number(e.target.value) / 100)}
              className="hidden md:block"
              style={{ width: 72, height: 3, accentColor, cursor: "pointer" }}
            />
            <button
              onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.2).toFixed(1))))}
              disabled={zoom >= 3.0}
              style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                color: zoom >= 3.0 ? "#BCBCBC" : "#2e2e2e",
                fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: zoom >= 3.0 ? "default" : "pointer",
                borderRadius: 6, transition: "color 0.15s",
              }}
            >+</button>
            <span style={{ fontSize: 10, color: "#888", minWidth: 28 } as React.CSSProperties}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: "#D0D0D0", flexShrink: 0, margin: "0 4px" }} className="hidden md:block" />

          {/* 페이지 번호 */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "#2e2e2e", opacity: 0.5, letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>
              {pageDisplay} / {total}
            </span>
          </div>

          {/* 이전/다음 */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <button onClick={() => canPrev && setSpread(s => s - 1)} disabled={!canPrev}
              style={{
                width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                color: canPrev ? "#2e2e2e" : "#C0C0C0",
                background: "none", border: "none", cursor: canPrev ? "pointer" : "default",
                borderRadius: 6, transition: "color 0.15s",
              }}>
              <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => canNext && setSpread(s => s + 1)} disabled={!canNext}
              style={{
                width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                color: canNext ? "#2e2e2e" : "#C0C0C0",
                background: "none", border: "none", cursor: canNext ? "pointer" : "default",
                borderRadius: 6, transition: "color 0.15s",
              }}>
              <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* 전체화면 — PC */}
          <button onClick={toggleFullscreen}
            className="hidden md:flex"
            style={{
              width: 30, height: 30, alignItems: "center", justifyContent: "center",
              color: "#2e2e2e", opacity: 0.45, background: "none", border: "none", cursor: "pointer",
              borderRadius: 6, transition: "opacity 0.15s", marginLeft: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}
          >
            {isFullscreen
              ? <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
              : <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
