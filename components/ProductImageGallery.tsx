"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import type { Product } from "@/data/products";

type Media = { kind: "image" | "video"; url: string };

// 영상 URL → 임베드/포스터 추출 (YouTube·Vimeo. 그 외는 직접 파일로 간주)
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}
function videoEmbedSrc(url: string): string | null {
  const y = ytId(url); if (y) return `https://www.youtube.com/embed/${y}`;
  const v = vimeoId(url); if (v) return `https://player.vimeo.com/video/${v}`;
  return null; // 직접 파일(mp4 등)
}
function videoPoster(url: string): string | null {
  const y = ytId(url); if (y) return `https://img.youtube.com/vi/${y}/hqdefault.jpg`;
  return null;
}

function PlayBadge({ size = 24 }: { size?: number }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="rounded-full bg-black/55 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
      </span>
    </span>
  );
}

export default function ProductImageGallery({ product }: { product: Product }) {
  // 이미지(대표+추가) 먼저, 영상은 맨 뒤 썸네일로
  const media: Media[] = [
    ...(([product.imageUrl, ...(product.subImages ?? [])].filter(Boolean) as string[]).map(
      (url): Media => ({ kind: "image", url })
    )),
    ...(product.videoUrl?.trim() ? [{ kind: "video" as const, url: product.videoUrl.trim() }] : []),
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"up" | "down" | "left" | "right">("down");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const go = (i: number, dir?: typeof slideDir) => {
    if (i === activeIdx || i < 0 || i >= media.length) return;
    setSlideDir(dir ?? (i > activeIdx ? "down" : "up"));
    setAnimKey((k) => k + 1);
    setActiveIdx(i);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      go(dx > 0 ? activeIdx + 1 : activeIdx - 1, dx > 0 ? "left" : "right");
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const noMedia = media.length === 0;
  const active = media[activeIdx];
  // 대표 이미지(첫 번째)는 #EBEBEB, 추가 이미지는 #FFFFFF 배경
  const mainAreaBg = activeIdx === 0 ? "#EBEBEB" : "#FFFFFF";
  // 의류(상의·하의·아우터)는 착용컷이 프레임을 꽉 채워야 자연스러워 기존 방식(object-cover, 잘림 있음) 유지.
  // 신발·소품 등 제품 단독 컷만 여백 방지(object-contain)를 적용한다.
  const isClothing = /상의|하의|아우터/.test(product.subCategory ?? "");

  // 메인 영역 렌더 (이미지/영상 공통)
  const renderMain = (sizes: string) => {
    if (!active) return null;
    if (active.kind === "video") {
      const embed = videoEmbedSrc(active.url);
      return embed ? (
        <iframe src={embed} title={product.name} allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen className="absolute inset-0 w-full h-full bg-black" />
      ) : (
        <video src={active.url} controls playsInline className="absolute inset-0 w-full h-full object-contain bg-black" />
      );
    }
    return <Image src={active.url} alt={product.name} fill className={isClothing ? "object-cover" : "object-contain"} priority sizes={sizes} />;
  };

  return (
    <>
      <style>{`
        @keyframes slideInDown  { from { transform: translateY(18px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInUp    { from { transform: translateY(-18px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInLeft  { from { transform: translateX(28px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(-28px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        .gal-down  { animation: slideInDown  0.32s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .gal-up    { animation: slideInUp    0.32s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .gal-left  { animation: slideInLeft  0.32s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .gal-right { animation: slideInRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      `}</style>

      {/* ── 모바일: 스와이프 캐러셀 ── */}
      <div className="md:hidden">
        <div
          className="relative w-full aspect-[4/5] overflow-hidden"
          style={{ backgroundColor: mainAreaBg }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {noMedia ? (
            <div className={`absolute inset-0 ${product.bg} flex items-center justify-center`}>
              <span className="text-white/20 text-xs tracking-widest uppercase">WORKUP</span>
            </div>
          ) : (
            <div key={animKey} className={`absolute inset-0 ${
              slideDir === "left" ? "gal-left" : slideDir === "right" ? "gal-right" : "gal-down"
            }`}>
              {renderMain("100vw")}
            </div>
          )}

          {product.isNew && (
            <span className="absolute top-4 left-4 bg-[#E5541B] text-white text-xs font-bold px-2.5 py-1 tracking-widest z-10">
              NEW
            </span>
          )}
        </div>

        {/* 도트 인디케이터 */}
        <div className="flex justify-center gap-2 pt-3 min-h-[20px]">
          {media.length > 1 && media.map((m, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`미디어 ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIdx ? "bg-[#303236] scale-125" : "bg-gray-300"
              } ${m.kind === "video" ? "ring-1 ring-[#E5541B] ring-offset-1" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* ── 데스크탑: 썸네일 스트립 + 메인 (좌측 컬럼과 함께 스크롤) ── */}
      <div className="hidden md:flex h-screen">
        {/* 썸네일 스트립 */}
        {media.length > 1 && (
          <div className="w-[80px] bg-white flex flex-col flex-shrink-0">
            <button type="button" aria-label="이전 썸네일"
              onClick={() => stripRef.current?.scrollBy({ top: -180, behavior: "smooth" })}
              className="flex items-center justify-center py-2 text-gray-300 hover:text-[#303236] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>

            <div ref={stripRef} className="flex flex-col gap-2 px-2 overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
              {media.map((m, i) => (
                <button key={i} onClick={() => go(i, i > activeIdx ? "down" : "up")}
                  className={`relative w-full aspect-[4/5] flex-shrink-0 overflow-hidden transition-opacity ${
                    i === activeIdx ? "opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                  style={{ outline: i === activeIdx ? "2px solid #303236" : "none", outlineOffset: "-2px" }}
                >
                  {m.kind === "video" ? (
                    <span className="absolute inset-0 bg-black">
                      {videoPoster(m.url) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={videoPoster(m.url)!} alt="" className="w-full h-full object-cover opacity-80" />
                      )}
                      <PlayBadge size={26} />
                    </span>
                  ) : (
                    <Image src={m.url} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="72px" />
                  )}
                </button>
              ))}
            </div>

            <button type="button" aria-label="다음 썸네일"
              onClick={() => stripRef.current?.scrollBy({ top: 180, behavior: "smooth" })}
              className="flex items-center justify-center py-2 text-gray-300 hover:text-[#303236] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* 메인 영역 */}
        <div className="relative flex-1 overflow-hidden" style={{ backgroundColor: mainAreaBg }}>
          {noMedia ? (
            <div className={`absolute inset-0 ${product.bg} flex items-center justify-center`}>
              <span className="text-white/20 text-xs tracking-widest uppercase">WORKUP {product.line}</span>
            </div>
          ) : (
            <div key={animKey} className={`absolute inset-0 ${
              slideDir === "down" ? "gal-down" : slideDir === "up" ? "gal-up" :
              slideDir === "left" ? "gal-left" : "gal-right"
            }`}>
              {renderMain("60vw")}
            </div>
          )}

          {product.isNew && (
            <span className="absolute top-5 left-5 bg-[#E5541B] text-white text-xs font-bold px-3 py-1 tracking-widest z-10">
              NEW
            </span>
          )}
        </div>
      </div>
    </>
  );
}
