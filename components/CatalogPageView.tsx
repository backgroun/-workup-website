"use client";
import { useState } from "react";
import Link from "next/link";
import type { CatalogPage, CatalogHotspot } from "@/data/catalog";
import { ikSrc } from "@/lib/imageSrc";

// ── 핫스팟 팝업 ──
function HotspotDot({ spot, idx, active, onToggle }: {
  spot: CatalogHotspot; idx: number; active: boolean; onToggle: (i: number) => void;
}) {
  const popupAbove = spot.y > 55; // 이미지 하단이면 팝업을 위쪽에
  const popupLeft  = spot.x > 60; // 오른쪽이면 팝업을 왼쪽에

  return (
    <div
      className="absolute"
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)", zIndex: active ? 20 : 10 }}
    >
      <style>{`@keyframes wu-hs-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.55)}100%{box-shadow:0 0 0 18px rgba(255,255,255,0)}}`}</style>
      {/* 도트 버튼 */}
      <button
        onMouseDown={e => { e.stopPropagation(); onToggle(idx); }}
        className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{
          backgroundColor: "rgba(255,255,255,0.35)",
          border: "1.5px solid rgba(255,255,255,0.4)",
          backdropFilter: "blur(4px)",
          animation: active ? "none" : "wu-hs-pulse 2.4s infinite",
        }}
        aria-label={spot.name}
      >
        <span className="font-bold leading-none select-none" style={{ fontSize: 17, color: "transparent" }}>+</span>
      </button>

      {/* 팝업 */}
      {active && (
        <div
          className="absolute"
          style={{
            width: 168,
            backgroundColor: "rgba(13,15,18,0.97)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "10px 12px",
            bottom: popupAbove ? "calc(100% + 8px)" : "auto",
            top:    popupAbove ? "auto" : "calc(100% + 8px)",
            right:  popupLeft  ? 0      : "auto",
            left:   popupLeft  ? "auto" : 0,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <p className="text-white font-bold text-[12px] leading-snug">{spot.name}</p>
          {spot.desc  && <p className="text-white/55 text-[10px] mt-1 leading-snug">{spot.desc}</p>}
          {spot.price && <p className="text-[#E5541B] text-[12px] font-semibold mt-1.5">{spot.price}</p>}
          {spot.href  && (
            <Link href={spot.href}
              onMouseDown={e => e.stopPropagation()}
              className="inline-block mt-2 text-[10px] text-white/70 border border-white/20 rounded px-2 py-0.5 hover:border-[#E5541B] hover:text-[#E5541B] transition-colors">
              자세히 보기
            </Link>
          )}
          {/* 닫기 */}
          <button onClick={() => onToggle(idx)}
            className="absolute top-1.5 right-2 text-white/30 hover:text-white/70 text-[12px] leading-none transition-colors">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// 카탈로그 한 페이지의 시각 표현 — 플립북과 관리자 미리보기에서 공용으로 사용한다(DRY).
// 종류(page_type): cover/contents/divider 는 고정 px, image 는 업로드 이미지 + 핫스팟(cqw 비례).
export default function CatalogPageView({ page }: { page: CatalogPage }) {
  const type = page.page_type ?? "image";
  const d = page.data ?? {};
  const [activeHotspot, setActiveHotspot] = useState(-1);

  const toggleHotspot = (i: number) => setActiveHotspot(prev => prev === i ? -1 : i);
  const closeAll = () => setActiveHotspot(-1);

  // ── 표지 ──
  if (type === "cover") {
    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden" style={{ padding: "8% 9%", backgroundColor: d.bg || "#303236" }}>
        {page.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ikSrc(page.image_url, 1200)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}
        <div className="relative">
          {d.eyebrow && <p className="text-[9px] tracking-[0.2em] text-[#E5541B] uppercase">{d.eyebrow}</p>}
          {d.season && <p className="text-[8px] tracking-[0.15em] text-gray-300 uppercase mt-0.5">{d.season}</p>}
        </div>
        <div className="relative">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">{d.brand || "WORKUP"}</h1>
          {d.badge && <p className="text-lg font-bold text-[#E5541B] tracking-widest mt-1">{d.badge}</p>}
          {d.note && <p className="text-[9px] text-gray-300 mt-2 tracking-widest">{d.note}</p>}
        </div>
        <div className="relative">
          {d.code && <p className="text-[7px] text-gray-400 tracking-widest">{d.code}</p>}
        </div>
      </div>
    );
  }

  // ── 목차 ──
  if (type === "contents") {
    const items = d.items ?? [];
    return (
      <div className="w-full h-full bg-white flex flex-col" style={{ padding: "8% 9%" }}>
        {d.eyebrow && <p className="text-[8px] tracking-[0.2em] text-[#E5541B] uppercase mb-3">{d.eyebrow}</p>}
        <div className="flex-1 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#303236]">{item.name}</span>
                {item.count && <span className="text-[8px] text-gray-400">{item.count}</span>}
              </div>
              {item.page && <span className="text-[8px] text-gray-400">{item.page}</span>}
            </div>
          ))}
        </div>
        {d.footer && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[7px] text-gray-300 tracking-widest">{d.footer}</p>
          </div>
        )}
      </div>
    );
  }

  // ── 카테고리 구분 ──
  if (type === "divider") {
    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden" style={{ padding: "8% 9%", backgroundColor: d.bg || "#303236" }}>
        {page.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ikSrc(page.image_url, 1200)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/35" />
          </>
        )}
        {d.eyebrow && <p className="relative text-[8px] tracking-[0.15em] text-white/50 uppercase">{d.eyebrow}</p>}
        <div className="relative">
          {d.no && <div className="text-6xl font-black text-white/10 leading-none select-none mb-2">{d.no}</div>}
          <h2 className="text-3xl font-bold text-white">{d.title}</h2>
          {d.desc && <p className="text-[10px] text-gray-300 mt-2 leading-relaxed whitespace-pre-line">{d.desc}</p>}
          {d.count && <p className="text-[9px] text-[#E5541B] mt-3">{d.count}</p>}
        </div>
        <div className="relative" />
      </div>
    );
  }

  // ── 이미지 페이지 (기본) — 핫스팟 지원 ──
  const hotspots: CatalogHotspot[] = d.hotspots ?? [];
  const hasCaption = !!(page.title || page.description);

  return (
    <div
      className="relative w-full h-full bg-[#0d1826] overflow-hidden"
      style={{ containerType: "inline-size" }}
      onMouseDown={hotspots.length > 0 ? closeAll : undefined}
    >
      {page.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ikSrc(page.image_url, 1200)} alt={page.title || page.admin_title || "카탈로그 페이지"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/25" style={{ fontSize: "4cqw" }}>이미지 없음</div>
      )}

      {/* 핫스팟 도트 */}
      {hotspots.map((spot, i) => (
        <HotspotDot key={i} spot={spot} idx={i} active={activeHotspot === i} onToggle={toggleHotspot} />
      ))}

      {/* 캡션 (타이틀/설명) */}
      {hasCaption && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ padding: "6%", paddingTop: "16%", background: "linear-gradient(to top, rgba(0,0,0,0.74), rgba(0,0,0,0.28) 55%, transparent)" }}
        >
          {page.title && <h2 className="text-white font-bold leading-tight" style={{ fontSize: "4.4cqw", letterSpacing: "-0.01em" }}>{page.title}</h2>}
          {page.description && <p className="text-white/85 leading-snug" style={{ fontSize: "2.6cqw", marginTop: "1.2cqw", letterSpacing: "-0.01em" }}>{page.description}</p>}
        </div>
      )}
    </div>
  );
}
