"use client";
import { useState } from "react";
import Link from "next/link";
import type { CatalogPage, CatalogHotspot, CatalogTile } from "@/data/catalog";
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

// ── 분할(split) 페이지의 한 칸 ──
function SplitTile({ tile }: { tile: CatalogTile }) {
  const [active, setActive] = useState(-1);
  const spots = tile.hotspots ?? [];
  const inner = (
    <div
      className="relative w-full h-full bg-[#0d1826] overflow-hidden"
      style={{ containerType: "inline-size" }}
      onMouseDown={spots.length > 0 ? () => setActive(-1) : undefined}
    >
      {tile.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ikSrc(tile.image_url, 900)} alt={tile.title || "카탈로그 분할 이미지"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/25" style={{ fontSize: "5cqw" }}>이미지 없음</div>
      )}
      {spots.map((spot, i) => (
        <HotspotDot key={i} spot={spot} idx={i} active={active === i} onToggle={(n) => setActive((p) => (p === n ? -1 : n))} />
      ))}
      {tile.title && (
        <div className="absolute left-0 bottom-0" style={{ padding: "4cqw" }}>
          <div className="inline-block max-w-[86%]" style={{ backgroundColor: "rgba(13,15,18,0.82)", borderRadius: "1.6cqw", padding: "1.6cqw 2.8cqw" }}>
            <p className="text-white font-semibold leading-tight" style={{ fontSize: "3cqw", letterSpacing: "-0.01em" }}>{tile.title}</p>
          </div>
        </div>
      )}
    </div>
  );
  if (tile.href) {
    return <Link href={tile.href} className="block w-full h-full">{inner}</Link>;
  }
  return inner;
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

  // ── 목차 ── (페이지 크기에 비례하도록 cqw 단위 사용)
  if (type === "contents") {
    const items = d.items ?? [];
    return (
      <div className="w-full h-full bg-white flex flex-col" style={{ padding: "8% 9%", containerType: "inline-size" }}>
        {d.eyebrow && <p className="tracking-[0.2em] text-[#E5541B] uppercase" style={{ fontSize: "2cqw" }}>{d.eyebrow}</p>}
        {/* 제목↔리스트 사이 여백: 리스트가 짧으면 크게, 길면 작게 (남는 공간을 흡수) */}
        <div style={{ flexGrow: 2, minHeight: "6cqw" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1.6cqw" }}>
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-100" style={{ paddingBottom: "2cqw" }}>
              <div className="flex items-baseline" style={{ gap: "2cqw" }}>
                <span className="font-semibold text-[#303236]" style={{ fontSize: "3.4cqw" }}>{item.name}</span>
                {item.count && <span className="text-gray-400" style={{ fontSize: "2cqw" }}>{item.count}</span>}
              </div>
              {item.page && <span className="text-gray-400" style={{ fontSize: "2cqw" }}>{item.page}</span>}
            </div>
          ))}
        </div>
        {/* 리스트 아래 남는 공간 — 위 스페이서보다 크게 잡아 리스트를 화면 상단~중앙에 배치 */}
        <div style={{ flexGrow: 3 }} />
        {d.footer && (
          <div className="border-t border-gray-100" style={{ paddingTop: "2.5cqw" }}>
            <p className="text-gray-300 tracking-widest" style={{ fontSize: "1.7cqw" }}>{d.footer}</p>
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

  // ── 분할(split) 페이지 ──
  if (type === "split") {
    const tiles = d.tiles ?? [];
    const layout = d.layout ?? "2col";
    const gridClass =
      layout === "2col" ? "grid-cols-2 grid-rows-1" :
      layout === "2row" ? "grid-cols-1 grid-rows-2" :
      layout === "3col" ? "grid-cols-3 grid-rows-1" :
      "grid-cols-2 grid-rows-2"; // grid4
    return (
      <div className={`w-full h-full bg-[#0d1826] grid ${gridClass} gap-[1cqw]`} style={{ containerType: "inline-size" }}>
        {tiles.map((t, i) => (
          <SplitTile key={i} tile={t} />
        ))}
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
        <div className="absolute left-0 bottom-0" style={{ padding: "3.5cqw" }}>
          <div className="inline-block max-w-[80%]" style={{ backgroundColor: "rgba(13,15,18,0.82)", borderRadius: "1.2cqw", padding: "1.4cqw 2.4cqw" }}>
            {page.title && <p className="text-white font-semibold leading-tight" style={{ fontSize: "2.4cqw", letterSpacing: "-0.01em" }}>{page.title}</p>}
            {page.description && <p className="text-white/70 leading-snug" style={{ fontSize: "1.9cqw", marginTop: "0.6cqw" }}>{page.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
