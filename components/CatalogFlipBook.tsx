"use client";
import { forwardRef, useRef, useState, useEffect } from "react";
import Link from "next/link";
import HTMLFlipBook from "react-pageflip";
import { products, getProductById } from "@/data/products";

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

export default function CatalogFlipBook() {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageW, setPageW] = useState(0);
  const [pageH, setPageH] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalPages = 18;

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // header (36 announcement + 56 header) = 92px
      // outer container offset = 100px (calc(100vh - 100px))
      // bottom nav controls = ~68px (buttons + padding)
      const NAV_H = 68;
      const HEADER_H = 92;
      const availH = vh - HEADER_H - NAV_H;

      if (vw < 768) {
        setIsPortrait(true);
        const wFromH = Math.round(availH / 1.4);
        const w = Math.min(wFromH, vw - 16);
        setPageW(w);
        setPageH(Math.round(w * 1.4));
      } else {
        setIsPortrait(false);
        // Two pages side by side — fit into available width and height
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

  const allColors = products.flatMap((p) => p.colors);

  if (!mounted || pageW === 0) {
    return (
      <div className="flex items-center justify-center bg-[#0d1826]" style={{ height: "calc(100vh - 92px)" }}>
        <p className="text-gray-600 text-xs tracking-widest">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1826] flex flex-col items-center" style={{ height: "calc(100vh - 92px)" }}>
      {/* Flipbook — fills available space */}
      <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
        <Book
          ref={bookRef}
          width={pageW}
          height={pageH}
          usePortrait={isPortrait}
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
          {/* PAGE 0: 표지 */}
          <FlipPage>
            <div className="w-full h-full bg-[#1A2B4A] flex flex-col justify-between" style={{ padding: "8% 9%" }}>
              <div>
                <p className="text-[9px] tracking-[0.2em] text-[#ff550c] uppercase">Product Catalog</p>
                <p className="text-[8px] tracking-[0.15em] text-gray-500 uppercase mt-0.5">2026 Spring / Summer</p>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight leading-none">WORKUP</h1>
                <p className="text-lg font-bold text-[#ff550c] tracking-widest mt-1">2026 SS</p>
                <p className="text-[9px] text-gray-500 mt-2 tracking-widest">{products.length} PRODUCTS</p>
              </div>
              <div>
                <div className="grid grid-cols-4 gap-1 mb-4">
                  {allColors.slice(0, 12).map((c, i) => (
                    <div key={i} className="aspect-square rounded-sm" style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
                <p className="text-[7px] text-gray-700 tracking-widest">Cat. WU-2026-SS-001</p>
              </div>
            </div>
          </FlipPage>

          {/* PAGE 1: 목차 */}
          <FlipPage>
            <div className="w-full h-full bg-white flex flex-col" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">Contents</p>
              <div className="flex-1 space-y-3">
                {[
                  { name: "작업복", count: 5, page: "P.3 – 7" },
                  { name: "캐주얼", count: 4, page: "P.9 – 12" },
                  { name: "안전용품", count: 1, page: "P.14" },
                  { name: "셋업", count: 0, page: "출시 예정" },
                  { name: "여성", count: 0, page: "출시 예정" },
                  { name: "잡화", count: 0, page: "출시 예정" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1A2B4A]">{item.name}</span>
                      {item.count > 0 && <span className="text-[8px] text-gray-400">{item.count}개</span>}
                    </div>
                    <span className="text-[8px] text-gray-400">{item.page}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[7px] text-gray-300 tracking-widest">WORKUP 2026 SS CATALOG</p>
              </div>
            </div>
          </FlipPage>

          {/* PAGE 2: 작업복 카테고리 */}
          <FlipPage>
            <div className="w-full h-full bg-[#1A2B4A] flex flex-col justify-between" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.15em] text-white/40 uppercase">Category 01</p>
              <div>
                <div className="text-6xl font-black text-white/10 leading-none select-none mb-2">01</div>
                <h2 className="text-3xl font-bold text-white">현장</h2>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">현장에서 검증된 퍼포먼스.<br />내구성과 기능성의 균형.</p>
                <p className="text-[9px] text-[#ff550c] mt-3">5개 제품</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {products.filter((p) => p.category === "현장").flatMap((p) => p.colors).slice(0, 9).map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
          </FlipPage>

          {/* PAGE 3–7: 작업복 제품 */}
          <FlipPage>{productPage("stretch-cargo-pants", 3)}</FlipPage>
          <FlipPage>{productPage("lightweight-windproof-jacket", 4)}</FlipPage>
          <FlipPage>{productPage("cooling-short-sleeve", 5)}</FlipPage>
          <FlipPage>{productPage("quick-dry-long-sleeve", 6)}</FlipPage>
          <FlipPage>{productPage("multi-pocket-vest", 7)}</FlipPage>

          {/* PAGE 8: 캐주얼 카테고리 */}
          <FlipPage>
            <div className="w-full h-full bg-[#3D3D3D] flex flex-col justify-between" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.15em] text-white/40 uppercase">Category 02</p>
              <div>
                <div className="text-6xl font-black text-white/10 leading-none select-none mb-2">02</div>
                <h2 className="text-3xl font-bold text-white">캐주얼</h2>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">현장에서 일상까지.<br />경계 없는 워크스타일.</p>
                <p className="text-[9px] text-[#ff550c] mt-3">4개 제품</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {products.filter((p) => p.category === "일상").flatMap((p) => p.colors).slice(0, 9).map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
          </FlipPage>

          {/* PAGE 9–12: 캐주얼 제품 */}
          <FlipPage>{productPage("work-chino-pants", 9)}</FlipPage>
          <FlipPage>{productPage("heavy-crewneck-sweatshirt", 10)}</FlipPage>
          <FlipPage>{productPage("windproof-hoodie-zip", 11)}</FlipPage>
          <FlipPage>{productPage("work-rollup-shirt", 12)}</FlipPage>

          {/* PAGE 13: 안전용품 카테고리 */}
          <FlipPage>
            <div className="w-full h-full bg-[#4A5240] flex flex-col justify-between" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.15em] text-white/40 uppercase">Category 03</p>
              <div>
                <div className="text-6xl font-black text-white/10 leading-none select-none mb-2">03</div>
                <h2 className="text-3xl font-bold text-white">소품</h2>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">현장 안전은 타협 없이.<br />눈에 띄어야 살아남습니다.</p>
                <p className="text-[9px] text-[#ff550c] mt-3">1개 제품</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {products.filter((p) => p.category === "소품").flatMap((p) => p.colors).map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
          </FlipPage>

          {/* PAGE 14: 안전용품 제품 */}
          <FlipPage>{productPage("reflective-safety-jacket", 14)}</FlipPage>

          {/* PAGE 15: 출시 예정 */}
          <FlipPage>
            <div className="w-full h-full bg-[#F5F2ED] flex flex-col items-center justify-center" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.2em] text-[#ff550c] uppercase mb-4">Coming Soon</p>
              <h2 className="text-2xl font-bold text-[#1A2B4A] mb-6 text-center">2026 FW 출시 예정</h2>
              <div className="w-full space-y-2">
                {["셋업 라인", "여성 라인", "잡화"].map((cat) => (
                  <div key={cat} className="flex items-center gap-2 bg-white px-4 py-2.5 border border-gray-100">
                    <span className="w-1.5 h-1.5 bg-[#ff550c] rounded-full flex-shrink-0" />
                    <span className="text-xs text-[#1A2B4A] font-semibold">{cat}</span>
                    <span className="text-[8px] text-gray-400 ml-auto">출시 예정</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-6 text-center leading-relaxed">신제품 소식은 Instagram에서<br />먼저 만나보세요</p>
            </div>
          </FlipPage>

          {/* PAGE 16: 파트너십 */}
          <FlipPage>
            <div className="w-full h-full bg-[#1A2B4A] flex flex-col" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.2em] text-[#ff550c] uppercase mb-4">Partnership</p>
              <div className="flex-1 space-y-4">
                <div className="bg-[#243d5e] p-4">
                  <p className="text-xs font-bold text-white mb-1.5">가맹 창업 문의</p>
                  <p className="text-[9px] text-gray-400 leading-relaxed mb-2">WORKUP 브랜드로 독립 매장 창업을 준비 중이신가요?</p>
                  <p className="text-[9px] text-white/50">→ workup.kr/partnership</p>
                </div>
                <div className="bg-[#243d5e] p-4">
                  <p className="text-xs font-bold text-white mb-1.5">입점 문의</p>
                  <p className="text-[9px] text-gray-400 leading-relaxed mb-2">내 브랜드를 WORKUP 매장에 납품하고 싶다면?</p>
                  <p className="text-[9px] text-white/50">→ workup.kr/partnership</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#243d5e]">
                <p className="text-[8px] text-gray-600 tracking-widest">workup.kr</p>
              </div>
            </div>
          </FlipPage>

          {/* PAGE 17: 뒷표지 */}
          <FlipPage>
            <div className="w-full h-full bg-[#ff550c] flex flex-col justify-between" style={{ padding: "8% 9%" }}>
              <p className="text-[8px] tracking-[0.2em] text-white/60 uppercase">WORKUP</p>
              <div>
                <h2 className="text-2xl font-bold text-white leading-snug">일하는 사람이<br />제일 멋있다.</h2>
                <p className="text-[9px] text-white/70 mt-3">workup.kr</p>
              </div>
              <p className="text-[7px] text-white/50">© 2026 WORKUP. All rights reserved.</p>
            </div>
          </FlipPage>
        </Book>
      </div>

      {/* Navigation controls */}
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

function productPage(id: string, pageNum: number) {
  const p = getProductById(id);
  if (!p) return <div className="w-full h-full bg-gray-100" />;
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className={`${p.bg} relative`} style={{ height: "68%" }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : null}
        {p.isNew && (
          <span className="absolute top-2.5 left-2.5 bg-[#ff550c] text-white text-[7px] font-black px-1.5 py-0.5 tracking-widest">
            NEW
          </span>
        )}
        <span className="absolute bottom-2 right-3 text-white/10 text-3xl font-black select-none">WU</span>
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          {p.colors.map((c) => (
            <div key={c.name} className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between overflow-hidden" style={{ padding: "4% 7%" }}>
        <div>
          <p className="text-[7px] tracking-widest text-[#ff550c] uppercase mb-0.5">{p.category} · {p.subCategory}</p>
          <h3 className="text-sm font-bold text-[#1A2B4A] mb-0.5 leading-tight">{p.name}</h3>
          <ul className="space-y-0.5 mt-1">
            {p.features.slice(0, 2).map((f) => (
              <li key={f} className="flex items-center gap-1 text-[8px] text-gray-600">
                <span className="w-1 h-1 bg-[#ff550c] rounded-full flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-[#1A2B4A]">{p.price}</span>
          <span className="text-[7px] text-gray-300 tracking-widest">P.{pageNum}</span>
        </div>
      </div>
    </div>
  );
}
