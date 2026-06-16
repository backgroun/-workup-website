"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Editorial, EditorialSection } from "@/data/editorial";

function WhiteBox({
  section,
  colIndex,
  delayMs = 0,
}: {
  section: EditorialSection;
  colIndex: number;
  delayMs?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const duration = colIndex % 2 === 0 ? 650 : 900;
  const translateY = colIndex % 2 === 0 ? 40 : 70;

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        backgroundColor: "white",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transform: visible ? "translateY(0)" : `translateY(${translateY}px)`,
        transition: `transform ${duration}ms ease-out`,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {/* 이미지 — 440:495 = 8:9 컨테이너, object-contain으로 잘림 없음 */}
      <div className="relative w-full flex-shrink-0" style={{ paddingBottom: "112.5%" }}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {section.imageUrl ? (
            <img
              src={section.imageUrl}
              alt={section.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-gray-300 text-6xl font-black select-none">WU</span>
          )}
        </div>
      </div>

      {/* 텍스트 + 썸네일 */}
      <div
        style={{
          paddingTop: "25px",
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingBottom: "30px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#1A2B4A",
            lineHeight: 1.3,
            marginBottom: "30px",
          }}
        >
          {section.title}
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: "30px",
          }}
        >
          {section.desc}
        </p>

        {/* 썸네일 */}
        <div style={{ display: "flex", gap: "8px" }}>
          {section.items.map((item, j) => (
            <Link
              key={j}
              href={`/products/${item.productId}`}
              className="group"
              style={{ flex: "1 1 0", minWidth: 0, maxWidth: "128px" }}
            >
              <div
                className="flex items-center justify-center overflow-hidden bg-gray-100"
                style={{ width: "100%", aspectRatio: "1 / 1", marginBottom: "6px" }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="text-gray-300 text-[10px] font-black">WU</span>
                )}
              </div>
              <p style={{ fontSize: "11px", color: "#1A2B4A", lineHeight: 1.3, marginBottom: "3px" }}>
                {item.name}
              </p>
              <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1A2B4A" }}>
                {item.price}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeatureHeroLayout({
  editorial,
  reversed = false,
}: {
  editorial: Editorial;
  reversed?: boolean;
}) {
  const [hoveredTag, setHoveredTag] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  const { tags, sections } = editorial;

  // ── PC 히어로 패널 ──────────────────────────────────────────
  const imgPos = editorial.heroImagePosition ?? "50% 0%";
  const heroPanel = (
    <div
      className="relative"
      style={{ flex: "0 0 49.947%", minWidth: 0 }}
    >
      <div
        className="sticky top-0 overflow-hidden bg-gray-100"
        style={{ height: "100vh" }}
      >
        {editorial.heroImageUrl && (
          <img
            src={editorial.heroImageUrl}
            alt={editorial.title}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ objectPosition: imgPos }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 z-[1]" />

        {/* 태그 — PC는 pcX/pcY 우선, 없으면 x/y 사용 */}
        {tags.map((tag, i) => (
          <div
            key={i}
            className="absolute z-10"
            style={{ left: `${tag.pcX ?? tag.x}%`, top: `${tag.pcY ?? tag.y}%`, transform: "translate(-50%, -50%)" }}
            onMouseEnter={() => setHoveredTag(i)}
            onMouseLeave={() => setHoveredTag(null)}
          >
            <button
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,0.92)",
                backgroundColor: "transparent",
                cursor: "pointer",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.12)",
                transform: hoveredTag === i ? "scale(1.35)" : "scale(1)",
                transition: "transform 200ms ease",
              }}
            />
            {hoveredTag === i && (
              <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white shadow-xl z-20 w-[220px] p-4">
                <p className="text-[13px] text-[#1A2B4A] font-medium mb-0.5 leading-snug">{tag.name}</p>
                <p className="text-[15px] font-bold text-[#1A2B4A] mb-4">{tag.price}</p>
                <Link
                  href={`/products/${tag.productId}`}
                  className="flex items-center justify-between border border-gray-300 px-3 py-2 text-[12px] text-[#1A2B4A] hover:bg-gray-50 transition-colors"
                >
                  상품 보러가기
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        ))}

        <div className="absolute bottom-10 left-8 z-[2] text-white">
          <p className="text-sm mb-2 opacity-80 tracking-wide">{editorial.heroSubtitle}</p>
          <h1 className="text-3xl font-bold leading-tight">{editorial.title}</h1>
        </div>
      </div>
    </div>
  );

  // ── 콘텐츠 패널 (우측 4카드) ────────────────────────────────
  const contentPanel = (
    <div
      style={{
        flex: "0 0 50.053%",
        minWidth: 0,
        backgroundColor: "#f2f1ed",
        paddingTop: "60px",
        paddingBottom: "60px",
        paddingLeft: "20px",
        paddingRight: "25px",
        display: "flex",
        flexDirection: "column",
        gap: "80px",
      }}
    >
      <div style={{ display: "flex", gap: "25px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <WhiteBox section={sections[0]} colIndex={0} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <WhiteBox section={sections[1] ?? sections[0]} colIndex={1} delayMs={80} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "25px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <WhiteBox section={sections[2] ?? sections[0]} colIndex={2} delayMs={160} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <WhiteBox section={sections[3] ?? sections[1]} colIndex={3} delayMs={240} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── PC 레이아웃 (xl+) ── */}
      <div
        className="hidden xl:flex bg-white"
        style={reversed ? { position: "relative", zIndex: 1 } : undefined}
      >
        {reversed ? (
          <>
            {contentPanel}
            {heroPanel}
          </>
        ) : (
          <>
            {heroPanel}
            {contentPanel}
          </>
        )}
      </div>

      {/* ── 모바일 레이아웃 (< xl) ── */}
      <div className="xl:hidden">

        {/* 히어로 이미지 — 3:4 비율 컨테이너, 이미지+태그가 동일 좌표 공간 */}
        <div
          className="relative w-full overflow-hidden bg-gray-100"
          style={{ aspectRatio: "3 / 4" }}
        >
          {editorial.heroImageUrl && (
            <img
              src={editorial.heroImageUrl}
              alt={editorial.title}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 z-[1]" />

          {tags.map((tag, i) => (
            <button
              key={i}
              className="absolute z-10"
              style={{
                left: `${tag.x}%`,
                top: `${tag.y}%`,
                transform: "translate(-50%, -50%)",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,0.92)",
                backgroundColor: "transparent",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
              }}
              onClick={() => setSheetOpen(true)}
              aria-label={tag.name}
            />
          ))}

          <div className="absolute bottom-6 left-4 z-[2] text-white">
            <p className="text-xs mb-1 opacity-80">{editorial.heroSubtitle}</p>
            <h1 className="text-2xl font-bold leading-tight">{editorial.title}</h1>
          </div>
        </div>

        {/* 모바일 카드 목록 */}
        <div
          style={{
            backgroundColor: "#f2f1ed",
            paddingTop: "30px",
            paddingLeft: "15px",
            paddingRight: "15px",
            paddingBottom: "30px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {sections.map((section, i) => (
            <div key={i} style={{ backgroundColor: "white", overflow: "hidden" }}>
              {/* 이미지 — object-contain으로 잘림 없음 */}
              <div
                className="w-full flex items-center justify-center bg-gray-100"
                style={{ aspectRatio: "440 / 495" }}
              >
                {section.imageUrl ? (
                  <img
                    src={section.imageUrl}
                    alt={section.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-300 text-5xl font-black select-none">WU</span>
                )}
              </div>

              {/* 텍스트 + 상품 목록 */}
              <div style={{ paddingTop: "20px", paddingLeft: "15px", paddingRight: "15px", paddingBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1A2B4A", margin: 0, marginBottom: "16px" }}>
                  {section.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.7, margin: 0, marginBottom: "16px" }}>
                  {section.desc}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {section.items.map((item, j) => (
                    <Link
                      key={j}
                      href={`/products/${item.productId}`}
                      style={{ display: "flex", gap: "16px", alignItems: "center" }}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center bg-gray-100"
                        style={{ width: "72px", height: "72px" }}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-gray-300 text-xs font-black">WU</span>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", color: "#1A2B4A", lineHeight: 1.5, margin: 0, marginBottom: "3px" }}>
                          {item.name}
                        </p>
                        <p style={{ fontSize: "14px", fontWeight: "bold", color: "#1A2B4A", margin: 0 }}>
                          {item.price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 모바일 바텀시트 백드롭 */}
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[62] bg-black/50 transition-opacity duration-300 xl:hidden ${
            sheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSheetOpen(false)}
        />

        {/* 모바일 바텀시트 본체 */}
        <div
          className="fixed bottom-0 left-0 right-0 z-[63] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] max-h-[80vh] flex flex-col transition-transform duration-300 ease-out xl:hidden"
          style={{ transform: sheetOpen ? "translateY(0)" : "translateY(110%)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-center pt-3.5 pb-2 flex-shrink-0">
            <div className="w-9 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-[15px] font-bold text-[#1A2B4A]">대표 상품</h3>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 pt-4 pb-4">
            <div className="space-y-4">
              {tags.map((tag, i) => (
                <Link
                  key={i}
                  href={`/products/${tag.productId}`}
                  className="flex items-center gap-4"
                  onClick={() => setSheetOpen(false)}
                >
                  <div
                    className="flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden"
                    style={{ width: "72px", height: "72px" }}
                  >
                    {tag.imageUrl ? (
                      <img src={tag.imageUrl} alt={tag.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-gray-300 text-xs font-black">WU</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#1A2B4A] mb-0.5 leading-snug">{tag.name}</p>
                    <p className="text-[14px] font-bold text-[#1A2B4A]">{tag.price}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="px-5 pb-6 pt-3 flex-shrink-0">
            <Link
              href={`/products/feature/${editorial.slug}`}
              className="flex items-center justify-center gap-2 w-full bg-[#1A2B4A] text-white py-4 text-[14px] font-semibold tracking-wide"
              onClick={() => setSheetOpen(false)}
            >
              기획전 바로가기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
