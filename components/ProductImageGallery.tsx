"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import type { Product } from "@/data/products";

export default function ProductImageGallery({ product }: { product: Product }) {
  const images = [product.imageUrl, ...(product.subImages ?? [])].filter(Boolean) as string[];

  const [activeIdx, setActiveIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"up" | "down" | "left" | "right">("down");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const go = (i: number, dir?: typeof slideDir) => {
    if (i === activeIdx || i < 0 || i >= images.length) return;
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

  const noImage = images.length === 0;

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
          className="relative w-full aspect-[4/5] bg-[#f4f4f4] overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {noImage ? (
            <div className={`absolute inset-0 ${product.bg} flex items-center justify-center`}>
              <span className="text-white/20 text-xs tracking-widest uppercase">WORKUP</span>
            </div>
          ) : (
            <div key={animKey} className={`absolute inset-0 ${
              slideDir === "left" ? "gal-left" : slideDir === "right" ? "gal-right" : "gal-down"
            }`}>
              <Image src={images[activeIdx]} alt={product.name} fill className="object-cover" priority sizes="100vw" />
            </div>
          )}

          {product.isNew && (
            <span className="absolute top-4 left-4 bg-[#ff550c] text-white text-xs font-bold px-2.5 py-1 tracking-widest z-10">
              NEW
            </span>
          )}

        </div>

        {/* 도트 인디케이터 */}
        <div className="flex justify-center gap-2 pt-3 min-h-[20px]">
          {images.length > 1 && images.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? "bg-[#1A2B4A] scale-125" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>

      {/* ── 데스크탑: 썸네일 스트립 + 메인 이미지 ── */}
      <div className="hidden md:flex h-screen sticky top-0">
        {/* 썸네일 스트립 */}
        {images.length > 1 && (
          <div className="w-[72px] bg-[#f4f4f4] flex flex-col gap-0 overflow-y-auto flex-shrink-0">
            {images.map((src, i) => (
              <button key={i} onClick={() => go(i, i > activeIdx ? "down" : "up")}
                className={`relative w-full aspect-[4/5] flex-shrink-0 overflow-hidden transition-opacity ${
                  i === activeIdx ? "opacity-100" : "opacity-50 hover:opacity-80"
                }`}
                style={{ outline: i === activeIdx ? "2px solid #1A2B4A" : "none", outlineOffset: "-2px" }}
              >
                <Image src={src} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="72px" />
              </button>
            ))}
          </div>
        )}

        {/* 메인 이미지 */}
        <div className="relative flex-1 bg-[#f4f4f4] overflow-hidden">
          {noImage ? (
            <div className={`absolute inset-0 ${product.bg} flex items-center justify-center`}>
              <span className="text-white/20 text-xs tracking-widest uppercase">WORKUP {product.line}</span>
            </div>
          ) : (
            <div key={animKey} className={`absolute inset-0 ${
              slideDir === "down" ? "gal-down" : slideDir === "up" ? "gal-up" :
              slideDir === "left" ? "gal-left" : "gal-right"
            }`}>
              <Image src={images[activeIdx]} alt={product.name} fill className="object-cover" priority sizes="60vw" />
            </div>
          )}

          {product.isNew && (
            <span className="absolute top-5 left-5 bg-[#ff550c] text-white text-xs font-bold px-3 py-1 tracking-widest z-10">
              NEW
            </span>
          )}
        </div>
      </div>
    </>
  );
}
