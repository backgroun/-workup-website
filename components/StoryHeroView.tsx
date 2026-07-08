"use client";
import type { StoryHero } from "@/data/story";

// /story 상단 히어로. 공개 페이지와 관리자 미리보기에서 공용으로 사용(DRY).
// image_url 이 없으면 현재 디자인(네이비 + 'WU' 워터마크 + 그라디언트)을 그대로 유지한다.
export default function StoryHeroView({ hero }: { hero: StoryHero }) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: `${hero.height}px`, backgroundColor: hero.bg || "#1A2B4A" }}
    >
      {hero.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero.image_url}
          alt={hero.heading || "WORKUP STORY"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* WU 워터마크 */}
      {hero.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-end pr-16 opacity-[0.04] select-none pointer-events-none">
          <span className="text-white font-black leading-none" style={{ fontSize: "320px" }}>WU</span>
        </div>
      )}

      {/* 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      {/* 텍스트 — 좌하단 (폰트 배율 --st-fs 적용) */}
      <div className="absolute bottom-12 px-[15px] md:px-[70px]">
        <h1 className="text-[calc(38px*var(--st-fs,1))] md:text-[calc(54px*var(--st-fs,1))] font-bold text-white leading-[1.15] mb-5 whitespace-pre-line">
          {hero.heading}
        </h1>
        {hero.sub && <p className="text-white/60 text-[calc(14px*var(--st-fs,1))]">{hero.sub}</p>}
      </div>
    </div>
  );
}
