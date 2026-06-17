"use client";
import { forwardRef, useRef, useState, useEffect } from "react";
import Link from "next/link";
import HTMLFlipBook from "react-pageflip";
import type { CatalogPage } from "@/data/catalog";
import CatalogPageView from "./CatalogPageView";

const FlipPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {children}
    </div>
  )
);
FlipPage.displayName = "FlipPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Book = HTMLFlipBook as any;

// 관리자(/admin/catalog)에서 등록한 페이지들을 플립북으로 렌더한다.
// 페이지 내용(이미지·텍스트·링크)은 전부 데이터 기반 — 코드 수정 없이 카탈로그를 교체할 수 있다.
export default function CatalogFlipBook({ pages }: { pages: CatalogPage[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageW, setPageW] = useState(0);
  const [pageH, setPageH] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalPages = pages.length;

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // header = 탑바(가변, 0=꺼짐) + 56px 헤더 / bottom nav controls ≈ 68px
      const NAV_H = 68;
      const tbRaw = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--wu-topbar-h"), 10);
      const topbarH = Number.isFinite(tbRaw) ? tbRaw : 36; // 0(꺼짐)도 보존, 파싱 실패만 36 폴백
      const HEADER_H = topbarH + 56;
      const availH = vh - HEADER_H - NAV_H;

      if (vw < 768) {
        setIsPortrait(true);
        const wFromH = Math.round(availH / 1.4);
        const w = Math.min(wFromH, vw - 16);
        setPageW(w);
        setPageH(Math.round(w * 1.4));
      } else {
        setIsPortrait(false);
        // 두 페이지를 펼친 형태 — 가용 너비/높이에 맞춤
        const wFromH = Math.round(availH / 1.4);
        const wFromVW = Math.floor((vw - 40) / 2);
        const w = Math.min(wFromH, wFromVW);
        setPageW(w);
        setPageH(Math.round(w * 1.4));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted || pageW === 0) {
    return (
      <div className="flex items-center justify-center bg-[#0d1826]" style={{ height: "calc(100vh - var(--wu-topbar-h, 36px) - 56px)" }}>
        <p className="text-gray-600 text-xs tracking-widest">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1826] flex flex-col items-center" style={{ height: "calc(100vh - var(--wu-topbar-h, 36px) - 56px)" }}>
      {/* 플립북 — 가용 공간을 채움 */}
      <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
        <Book
          ref={bookRef}
          width={pageW}
          height={pageH}
          usePortrait={isPortrait}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onFlip={(e: any) => setCurrentPage(e.data)}
          maxShadowOpacity={0.6}
          showCover={true}
          mobileScrollSupport={true}
          style={{}}
          className=""
          startPage={0}
          size="fixed"
          minWidth={150}
          maxWidth={600}
          minHeight={200}
          maxHeight={840}
          drawShadow={true}
          flippingTime={700}
          startZIndex={0}
          autoSize={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((page) => (
            <FlipPage key={page.id}>
              <CatalogPageView page={page} />
            </FlipPage>
          ))}
        </Book>
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex-shrink-0 flex items-center gap-6 py-3">
        <Link
          href="/"
          className="w-9 h-9 bg-[#1A2B4A] border border-[#243d5e] hover:border-[#ff550c] text-white flex items-center justify-center transition-colors"
          aria-label="메인으로"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <button
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          disabled={currentPage === 0}
          className="w-9 h-9 bg-[#1A2B4A] border border-[#243d5e] hover:border-[#ff550c] text-white text-xl flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        <span className="text-gray-600 text-[10px] tracking-widest w-14 text-center">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          disabled={currentPage >= totalPages - 1}
          className="w-9 h-9 bg-[#1A2B4A] border border-[#243d5e] hover:border-[#ff550c] text-white text-xl flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}
