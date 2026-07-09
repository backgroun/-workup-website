"use client";
import Editable from "@/components/story-edit/Editable";
import type { StoryHero, HeroEditApi } from "@/data/story";

// /story 상단 히어로. 공개 페이지와 위지윅 편집기에서 공용으로 사용(DRY).
// edit 이 없으면 순수 렌더, 있으면 제목/서브 인라인 편집 + 배경 이미지 클릭 교체.
// image_url 이 없으면 네이비 + 'WU' 워터마크 + 그라디언트를 유지한다.
export default function StoryHeroView({ hero, edit }: { hero: StoryHero; edit?: HeroEditApi }) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: `${hero.height}px`, backgroundColor: hero.bg || "#1A2B4A" }}
    >
      {hero.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.image_url} alt={hero.heading || "WORKUP STORY"} className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* WU 워터마크 */}
      {hero.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-end pr-16 opacity-[0.04] select-none pointer-events-none">
          <span className="text-white font-black leading-none" style={{ fontSize: "320px" }}>WU</span>
        </div>
      )}

      {/* 그라디언트 — 좌·하단을 어둡게 해 흰 텍스트 가독성 확보 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

      {/* 배경 이미지 교체 버튼(편집 모드) */}
      {edit && (
        <button type="button"
          onClick={() => edit.pickImage((url) => edit.patch({ image_url: url }))}
          className="absolute top-4 right-4 z-10 text-[12px] font-semibold text-white bg-black/50 hover:bg-black/70 rounded-full px-4 py-2">
          {hero.image_url ? "배경 이미지 교체" : "배경 이미지 추가"}
        </button>
      )}

      {/* 텍스트 — 좌하단 (폰트 배율 --st-fs 적용) */}
      <div className="absolute bottom-12 px-[15px] md:px-[70px]">
        <Editable as="h1"
          className="text-[calc(38px*var(--st-fs,1))] md:text-[calc(54px*var(--st-fs,1))] font-bold text-white leading-[1.15] mb-5 whitespace-pre-line block"
          value={hero.heading} onChange={edit ? (v) => edit.patch({ heading: v }) : undefined}
          fx={hero.fx?.heading} onActivate={edit ? (px) => edit.activate("heading", px) : undefined} active={edit?.activeField === "heading"} placeholder="히어로 제목" />
        {(hero.sub || edit) && (
          <Editable as="p" className="text-white/70 text-[calc(14px*var(--st-fs,1))] block"
            value={hero.sub} onChange={edit ? (v) => edit.patch({ sub: v }) : undefined}
            fx={hero.fx?.sub} onActivate={edit ? (px) => edit.activate("sub", px) : undefined} active={edit?.activeField === "sub"} placeholder="서브 문구" multiline={false} />
        )}
      </div>
    </div>
  );
}
