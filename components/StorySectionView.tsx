"use client";
import { useState } from "react";
import Link from "next/link";
import Editable from "@/components/story-edit/Editable";
import { StoryIcon, ICON_OPTIONS, type IconKey } from "@/components/story-edit/StoryIcons";
import type { StorySection, SectionBg, SectionEditApi, PartialSection, PhotoItem, ValueItem, FeatureItem } from "@/data/story";

// /story 본문 섹션 한 개. 공개 페이지와 위지윅 편집기에서 공용으로 사용(DRY) → 시각 회귀 불가능.
// edit 이 없으면 순수 렌더(공개), 있으면 클릭 인라인 편집(관리자)이 켜진다.
// 크기·여백·줄간격·이미지 비율/너비는 부모가 주입하는 CSS 변수로 제어한다.
//   --st-fs 폰트배율(1) / --st-lh 본문줄간격(1.8) / --st-sp 섹션여백(1) / --st-ratio 이미지비율(4/3) / --st-imgcol,--st-textcol 컬럼비중(1fr)

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  beige: "bg-[#f2f1ed]",
};

const SEC = "py-[calc(6rem*var(--st-sp,1))] md:py-[calc(8rem*var(--st-sp,1))]";
const SEC_CTA = "py-[calc(5rem*var(--st-sp,1))] md:py-[calc(7rem*var(--st-sp,1))]";
const GRID = "grid grid-cols-1 gap-12 md:gap-20 items-center";
const COLS_TEXT_IMG = "md:grid-cols-[var(--st-textcol,1fr)_var(--st-imgcol,1fr)]";
const COLS_IMG_TEXT = "md:grid-cols-[var(--st-imgcol,1fr)_var(--st-textcol,1fr)]";
const LH = "leading-[var(--st-lh,1.8)]";
const IMG_RATIO = "var(--st-ratio, 4 / 3)";

// 이미지 클릭 교체 오버레이(편집 모드 전용)
function ImgPick({ onPick, has, children, className = "" }: { onPick?: () => void; has: boolean; children: React.ReactNode; className?: string }) {
  if (!onPick) return <>{children}</>;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onPick(); }} className={`group relative block w-full text-left ${className}`}>
      {children}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-black/40">
        <span className="opacity-0 group-hover:opacity-100 text-white text-[13px] font-semibold px-4 py-2 rounded-full bg-black/60 transition-opacity">
          {has ? "이미지 교체" : "이미지 추가"}
        </span>
      </span>
    </button>
  );
}

// 대형 이미지 패널(선언문·카테고리). 이미지가 없으면 네이비+WU 워터마크로 채운다. 상단 기준 크롭.
function StoryImagePanel({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="w-full h-full object-cover object-top" style={{ aspectRatio: IMG_RATIO }} />
    );
  }
  return (
    <div className="relative w-full overflow-hidden bg-[#1A2B4A]" style={{ aspectRatio: IMG_RATIO }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] select-none pointer-events-none">
        <span className="text-white font-black leading-none text-[220px]">WU</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}

// 편집 모드 작은 추가/삭제 버튼
function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 border border-dashed border-blue-300 rounded-full px-3 py-1.5 hover:bg-blue-50">
      + {label}
    </button>
  );
}
function DelBadge({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="삭제"
      className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center opacity-0 group-hover/item:opacity-100 shadow">
      ×
    </button>
  );
}

// 아이콘형 항목(특징3·핵심가치)의 아이콘 클릭 교체(편집 모드 전용). 프리셋 그리드에서 골라 즉시 반영.
function IconPickerButton({ icon, onPick, size = "w-14 h-14" }: { icon?: IconKey; onPick?: (icon: IconKey) => void; size?: string }) {
  const [open, setOpen] = useState(false);
  const circle = (
    <div className={`${size} rounded-full bg-[#1A2B4A]/[0.06] flex items-center justify-center text-[#1A2B4A]`}>
      <StoryIcon icon={icon} className="w-1/2 h-1/2" />
    </div>
  );
  if (!onPick) return circle;
  return (
    <div className="relative inline-block">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="group/icon relative rounded-full ring-offset-2 hover:ring-2 hover:ring-blue-400 transition-shadow">
        {circle}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-black/0 group-hover/icon:bg-black/30 flex items-center justify-center transition-colors">
          <span className="opacity-0 group-hover/icon:opacity-100 text-white text-[10px] font-semibold">교체</span>
        </span>
      </button>
      {open && (
        <div className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-4 gap-1 w-[176px]"
          onClick={(e) => e.stopPropagation()}>
          {ICON_OPTIONS.map((o) => (
            <button key={o.value} type="button" title={o.label}
              onClick={() => { onPick(o.value); setOpen(false); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-blue-50 ${icon === o.value ? "bg-blue-100 text-blue-600" : "text-slate-500"}`}>
              <StoryIcon icon={o.value} className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StorySectionView({ section, edit }: { section: StorySection; edit?: SectionEditApi }) {
  const bg = BG_CLASS[section.bg] ?? "bg-white";
  const eyebrowColor = section.bg === "beige" ? "text-gray-500" : "text-gray-400";
  const eyebrow = `text-[calc(11px*var(--st-fs,1))] tracking-[0.2em] ${eyebrowColor} uppercase`;

  // 텍스트 필드 onChange 헬퍼 — edit 없으면 undefined(순수 렌더)
  const t = (field: string) =>
    edit ? (v: string) => edit.patch({ [field]: v } as unknown as PartialSection) : undefined;
  const pickInto = (field: string) =>
    edit ? () => edit.pickImage((url) => edit.patch({ [field]: url } as unknown as PartialSection)) : undefined;
  // 편집 요소 공통 props: onChange + 개별 서식(fx) + 서식 툴바 활성화(onActivate) + 선택 표시(active).
  // key 는 fx 저장 키이자 활성 요소 식별자 — 최상위 필드는 필드명 그대로, 배열 항목은 "tags.0" 처럼 인덱스를 포함해
  // 서로 다른 요소가 같은 대상을 가리키는 일(=엉뚱한 텍스트가 바뀌는 버그) 없이 항상 고유해야 한다.
  const epi = (key: string, onChange?: (v: string) => void) => ({
    onChange,
    fx: section.fx?.[key],
    onActivate: edit ? (px?: number) => edit.activate(key, px) : undefined,
    active: edit?.activeField === key,
  });
  const ep = (field: string) => epi(field, t(field));

  switch (section.type) {
    // ── 브랜드 선언문 (텍스트 좌 · 대형 이미지 우) ──
    case "declaration":
      return (
        // Brand Declaration 전용 여백 — 가로 1900px 기준.
        // 가로: 좌 95(5%) · 텍스트 670(내용폭 38.84%) · 간격 35(2.03%) · 이미지 우 80(4.21%).
        // 세로: 텍스트 위/아래 120px, 제목→구분선 40px, 구분선→리드 40px → 전체 높이 ≈548px.
        //       이미지는 그 높이에 맞춰 위·아래 80px 여백의 가로 스트립(self-stretch + py-80 + h-full)이 된다.
        // 목업대로 상단 eyebrow 라벨은 생략. lg 미만은 세로 스택(모바일 여백).
        <section className={bg}>
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-10 lg:gap-0
                          px-[15px] py-16 lg:px-0 lg:py-0 lg:pl-[5%] lg:pr-[4.21%]">
            {/* 텍스트 크기(1900px 기준): 제목 40px · 본문(리드+강조문) 20px 회색으로 통일. 강조문은 큰 네이비 → 일반 본문으로 구조 변경. */}
            <div className="w-full lg:w-[38.84%] lg:shrink-0 lg:pt-[120px] lg:pb-[120px]">
              <Editable as="h2" className="text-[calc(28px*var(--st-fs,1))] lg:text-[calc(40px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.2] mb-0 whitespace-pre-line block"
                value={section.heading} {...ep("heading")} placeholder="제목" />
              <div className="w-10 h-[3px] bg-[#1A2B4A] my-6 lg:my-[40px]" />
              <Editable as="p" className={`text-[calc(16px*var(--st-fs,1))] lg:text-[calc(20px*var(--st-fs,1))] text-gray-600 ${LH} mb-5 block`}
                value={section.lead} {...ep("lead")} placeholder="리드 문장" />
              <p className={`text-[calc(16px*var(--st-fs,1))] lg:text-[calc(20px*var(--st-fs,1))] text-gray-600 ${LH} whitespace-pre-line`}>
                <Editable as="span" value={section.emphasis} {...ep("emphasis")} placeholder="본문" />
                {(section.emphasisStrong || edit) && (
                  <>
                    {"\n"}
                    <Editable as="span" className="font-bold text-[#1A2B4A]" value={section.emphasisStrong} {...ep("emphasisStrong")} placeholder="굵은 마무리(선택)" multiline={false} />
                  </>
                )}
              </p>
            </div>
            {/* 이미지: absolute 로 흐름에서 빼 텍스트가 높이(≈548)를 결정하게 하고, 그 안에서 위·아래 80px 스트립. */}
            <div className="w-full lg:ml-[2.03%] lg:flex-1 lg:self-stretch lg:relative">
              <div className="lg:absolute lg:inset-x-0 lg:top-[80px] lg:bottom-[80px]">
                <ImgPick onPick={pickInto("image_url")} has={!!section.image_url} className="lg:h-full">
                  {section.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={section.image_url} alt={section.heading || "브랜드 선언"}
                      className="w-full aspect-[3/2] lg:aspect-auto lg:h-full object-cover object-top" />
                  ) : (
                    <div className="relative w-full aspect-[3/2] lg:aspect-auto lg:h-full overflow-hidden bg-[#1A2B4A]">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] select-none pointer-events-none">
                        <span className="text-white font-black leading-none text-[220px]">WU</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  )}
                </ImgPick>
              </div>
            </div>
          </div>
        </section>
      );

    // ── Work Life Wear / Our Category (대형 이미지 좌 · 텍스트 우) ──
    case "category": {
      const tags = section.tags ?? [];
      const setTag = (i: number, v: string) => edit?.patch({ tags: tags.map((x, idx) => (idx === i ? v : x)) });
      const addTag = () => edit?.patch({ tags: [...tags, "New"] });
      const delTag = (i: number) => edit?.patch({ tags: tags.filter((_, idx) => idx !== i) });
      const shown = edit ? tags : tags.filter(Boolean);
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className={`${GRID} ${COLS_IMG_TEXT}`}>
              <div className="md:order-1 order-2">
                <ImgPick onPick={pickInto("image_url")} has={!!section.image_url}>
                  <StoryImagePanel src={section.image_url} alt={section.heading || "Work Life Wear"} />
                </ImgPick>
              </div>
              <div className="md:order-2 order-1">
                <Editable as="p" className={`${eyebrow} mb-7 block`} value={section.eyebrow} {...ep("eyebrow")} placeholder="Our Category" multiline={false} />
                <Editable as="h2" className="text-[calc(38px*var(--st-fs,1))] md:text-[calc(52px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.05] mb-7 block"
                  value={section.heading} {...ep("heading")} placeholder="Work Life Wear" multiline={false} />
                <Editable as="p" className={`text-[calc(18px*var(--st-fs,1))] md:text-[calc(21px*var(--st-fs,1))] text-gray-600 ${LH} mb-10 block`}
                  value={section.lead} {...ep("lead")} placeholder="리드 문장" />
                <div className="flex flex-wrap items-center gap-3 mb-10">
                  {shown.map((word, i, arr) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="group/item relative">
                        {edit && <DelBadge onClick={() => delTag(i)} />}
                        <Editable as="span" className="inline-block text-[calc(13px*var(--st-fs,1))] md:text-[calc(15px*var(--st-fs,1))] font-bold text-[#1A2B4A] tracking-wider border border-[#1A2B4A] px-5 py-2.5"
                          value={word} multiline={false} {...epi(`tags.${i}`, (v) => setTag(i, v))} />
                      </span>
                      {i < arr.length - 1 && <span className="text-gray-400 text-xl font-light">+</span>}
                    </div>
                  ))}
                  {edit && <AddBtn onClick={addTag} label="태그" />}
                </div>
                <Editable as="p" className={`text-[calc(15px*var(--st-fs,1))] md:text-[calc(16px*var(--st-fs,1))] text-gray-600 ${LH} whitespace-pre-line block`}
                  value={section.body} {...ep("body")} placeholder="하단 본문" />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── 핵심 가치 (layout: "number" 큰 흐린 숫자 / "icon" 원형 아이콘 + "01. 제목") ──
    case "values": {
      const items = section.items ?? [];
      const layout = section.layout ?? "number";
      const setItem = (i: number, patch: Partial<ValueItem>) =>
        edit?.patch({ items: items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
      const addItem = () => {
        const next = items.reduce((m, x) => Math.max(m, parseInt(x.num, 10) || 0), 0) + 1;
        edit?.patch({ items: [...items, { num: String(next).padStart(2, "0"), en: "", title: "새 항목", desc: "", icon: "check" }] });
      };
      const delItem = (i: number) => edit?.patch({ items: items.filter((_, idx) => idx !== i) });
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <Editable as="p" className={`${eyebrow} mb-7 block`} value={section.eyebrow} {...ep("eyebrow")} placeholder="Core Values" multiline={false} />
            <div className="flex items-center gap-3 mb-14">
              <Editable as="h2" className="text-[calc(28px*var(--st-fs,1))] md:text-[calc(36px*var(--st-fs,1))] font-bold text-[#1A2B4A]"
                value={section.heading} {...ep("heading")} placeholder="제목" multiline={false} />
              {edit && <AddBtn onClick={addItem} label="항목" />}
            </div>
            {layout === "icon" ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                {items.map((v, i) => (
                  <div key={i} className="group/item relative text-center">
                    {edit && items.length > 1 && <DelBadge onClick={() => delItem(i)} />}
                    <div className="flex justify-center mb-5">
                      <IconPickerButton icon={v.icon} onPick={edit ? (ic) => setItem(i, { icon: ic }) : undefined} />
                    </div>
                    <h3 className="text-[calc(16px*var(--st-fs,1))] md:text-[calc(18px*var(--st-fs,1))] font-bold text-[#1A2B4A] mb-2">
                      <Editable as="span" value={v.num} multiline={false} {...epi(`items.${i}.num`, edit ? (x) => setItem(i, { num: x }) : undefined)} />
                      <span>. </span>
                      <Editable as="span" value={v.title} placeholder="제목" multiline={false} {...epi(`items.${i}.title`, edit ? (x) => setItem(i, { title: x }) : undefined)} />
                    </h3>
                    <Editable as="p" className={`text-[calc(13px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line block`}
                      value={v.desc} placeholder="설명" {...epi(`items.${i}.desc`, edit ? (x) => setItem(i, { desc: x }) : undefined)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
                {items.map((v, i) => (
                  <div key={i} className="group/item relative bg-white p-6 md:p-9">
                    {edit && items.length > 1 && <DelBadge onClick={() => delItem(i)} />}
                    <Editable as="p" className="text-[calc(38px*var(--st-fs,1))] md:text-[calc(46px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-none mb-6 opacity-10 block"
                      value={v.num} multiline={false} {...epi(`items.${i}.num`, edit ? (x) => setItem(i, { num: x }) : undefined)} />
                    <Editable as="p" className="text-[calc(10px*var(--st-fs,1))] tracking-[0.18em] text-gray-400 uppercase mb-2 block"
                      value={v.en} placeholder="Function" multiline={false} {...epi(`items.${i}.en`, edit ? (x) => setItem(i, { en: x }) : undefined)} />
                    <Editable as="h3" className="text-[calc(18px*var(--st-fs,1))] md:text-[calc(20px*var(--st-fs,1))] font-bold text-[#1A2B4A] mb-4 block"
                      value={v.title} placeholder="제목" multiline={false} {...epi(`items.${i}.title`, edit ? (x) => setItem(i, { title: x }) : undefined)} />
                    <Editable as="p" className={`text-[calc(13px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line block`}
                      value={v.desc} placeholder="설명" {...epi(`items.${i}.desc`, edit ? (x) => setItem(i, { desc: x }) : undefined)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    // ── 창업 스토리 (텍스트 + 이미지) ──
    case "founding": {
      const imageLeft = section.imageSide === "left";
      const paras = section.paragraphs ?? [];
      const setPara = (i: number, v: string) => edit?.patch({ paragraphs: paras.map((x, idx) => (idx === i ? v : x)) });
      const addPara = () => edit?.patch({ paragraphs: [...paras, ""] });
      const delPara = (i: number) => edit?.patch({ paragraphs: paras.filter((_, idx) => idx !== i) });
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className={`${GRID} md:grid-cols-2`}>
              <div className={imageLeft ? "md:order-2" : ""}>
                <Editable as="p" className={`${eyebrow} mb-7 block`} value={section.eyebrow} {...ep("eyebrow")} placeholder="Founding Story" multiline={false} />
                <Editable as="h2" className="text-[calc(28px*var(--st-fs,1))] md:text-[calc(38px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-snug mb-9 whitespace-pre-line block"
                  value={section.heading} {...ep("heading")} placeholder="제목" />
                <div className={`space-y-5 text-[calc(13px*var(--st-fs,1))] md:text-[calc(15px*var(--st-fs,1))] text-gray-600 ${LH}`}>
                  {paras.map((para, i) => (
                    <div key={i} className="group/item relative">
                      {edit && paras.length > 1 && <DelBadge onClick={() => delPara(i)} />}
                      <Editable as="p" value={para} placeholder="본문 문단" {...epi(`paragraphs.${i}`, edit ? (v) => setPara(i, v) : undefined)} />
                      {i === 0 && section.emphasis && !edit && null}
                      {/* 인용구는 첫 문단 바로 다음에 표시 */}
                      {i === 0 && (section.emphasis || edit) && (
                        <Editable as="p" className="mt-5 text-[calc(15px*var(--st-fs,1))] font-semibold text-[#1A2B4A]"
                          value={section.emphasis} {...ep("emphasis")} placeholder="인용구" />
                      )}
                    </div>
                  ))}
                  {edit && <AddBtn onClick={addPara} label="문단" />}
                  {(section.closing || edit) && (
                    <Editable as="p" className="font-medium text-[#1A2B4A] whitespace-pre-line" value={section.closing} {...ep("closing")} placeholder="마무리 문장" />
                  )}
                </div>
              </div>
              <div className={imageLeft ? "md:order-1" : ""}>
                <ImgPick onPick={pickInto("image_url")} has={!!section.image_url}>
                  {section.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={section.image_url} alt={section.heading || "창업 스토리"} className="w-full h-full object-cover object-top" style={{ aspectRatio: IMG_RATIO }} />
                  ) : (
                    <div className="bg-[#1A2B4A] flex flex-col items-center justify-center gap-3" style={{ aspectRatio: IMG_RATIO }}>
                      <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-white/25 text-[11px] tracking-widest uppercase">사진을 교체해 주세요</p>
                    </div>
                  )}
                </ImgPick>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── 매장 유도 CTA ──
    case "cta": {
      const ctaClass =
        "inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-[calc(12px*var(--st-fs,1))] tracking-widest font-medium px-8 py-3.5 hover:bg-[#1A2B4A] hover:text-white transition-colors";
      const ctaBtn = section.ctaLabel && section.ctaHref
        ? (section.ctaHref.startsWith("/")
          ? <Link href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</Link>
          : <a href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</a>)
        : null;
      return (
        <section className={`${SEC_CTA} ${bg} border-t border-gray-100`}>
          <div className="px-[15px] md:px-[70px]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <Editable as="p" className={`${eyebrow} mb-6 block`} value={section.eyebrow} {...ep("eyebrow")} placeholder="Experience WORKUP" multiline={false} />
                <Editable as="h2" className="text-[calc(26px*var(--st-fs,1))] md:text-[calc(36px*var(--st-fs,1))] font-bold text-[#1A2B4A] mb-4 block"
                  value={section.heading} {...ep("heading")} placeholder="제목" multiline={false} />
                <Editable as="p" className={`text-[calc(13px*var(--st-fs,1))] md:text-[calc(15px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line block`}
                  value={section.body} {...ep("body")} placeholder="본문" />
              </div>
              <div className="md:shrink-0">
                {edit ? (
                  <div className="flex flex-col gap-2">
                    <Editable as="span" className={ctaClass} value={section.ctaLabel} {...ep("ctaLabel")} placeholder="버튼 문구" multiline={false} />
                    <Editable as="span" className="text-[11px] text-gray-400 font-mono border border-dashed border-gray-200 rounded px-2 py-1"
                      value={section.ctaHref} {...ep("ctaHref")} placeholder="/store · tel:... · 카카오톡 URL" multiline={false} />
                  </div>
                ) : ctaBtn}
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── 자유 텍스트 (제목 좌 · 본문 우) ──
    case "richtext":
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 md:gap-x-16">
              <div className="md:col-span-5">
                <Editable as="p" className={`${eyebrow} mb-7 block`} value={section.eyebrow} {...ep("eyebrow")} placeholder="Eyebrow" multiline={false} />
                <Editable as="h2" className="text-[calc(32px*var(--st-fs,1))] md:text-[calc(44px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.15] whitespace-pre-line block"
                  value={section.heading} {...ep("heading")} placeholder="제목" />
              </div>
              <div className="md:col-span-6 md:col-start-7 md:pt-2">
                <Editable as="p" className={`text-[calc(16px*var(--st-fs,1))] md:text-[calc(17px*var(--st-fs,1))] text-gray-600 ${LH} whitespace-pre-line block`}
                  value={section.body} {...ep("body")} placeholder="본문" />
              </div>
            </div>
          </div>
        </section>
      );

    // ── 사진 갤러리 ──
    case "photos": {
      const cols = section.columns ?? 3;
      const colClass: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4" };
      const imgSize = Math.floor(1920 / cols);
      const images = section.images ?? [];
      const setImg = (i: number, url: string) => edit?.patch({ images: images.map((x, idx) => (idx === i ? { ...x, url } : x)) });
      const addImg = () => edit?.patch({ images: [...images, { url: undefined, alt: "" } as PhotoItem] });
      const delImg = (i: number) => edit?.patch({ images: images.filter((_, idx) => idx !== i) });
      return (
        <section className={`${bg}`}>
          <div className={`grid ${colClass[cols] ?? "grid-cols-3"} gap-1`}>
            {images.map((img, i) => (
              <div key={i} className="group/item relative">
                {edit && images.length > 1 && <DelBadge onClick={() => delImg(i)} />}
                <ImgPick onPick={edit ? () => edit.pickImage((url) => setImg(i, url)) : undefined} has={!!img.url}>
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt={img.alt || ""} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 flex flex-col items-center justify-center gap-1">
                      <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[10px] text-gray-300 tracking-wider">{imgSize} × {imgSize}px</p>
                    </div>
                  )}
                </ImgPick>
              </div>
            ))}
          </div>
          {edit && (
            <div className="px-[15px] md:px-[70px] py-4">
              <AddBtn onClick={addImg} label="사진" />
            </div>
          )}
        </section>
      );
    }

    // ── 문제제기 (흑백 인물사진 + 짧은 공감 문구) ──
    case "problem": {
      const imageLeft = section.imageSide !== "right";
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className={`${GRID} ${imageLeft ? COLS_IMG_TEXT : COLS_TEXT_IMG}`}>
              <div className={imageLeft ? "md:order-1" : "md:order-2"}>
                <ImgPick onPick={pickInto("image_url")} has={!!section.image_url}>
                  {section.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={section.image_url} alt={section.heading || "문제 제기"} className="w-full h-full object-cover object-top grayscale"
                      style={{ aspectRatio: IMG_RATIO }} />
                  ) : (
                    <StoryImagePanel src={undefined} alt={section.heading || "문제 제기"} />
                  )}
                </ImgPick>
              </div>
              <div className={imageLeft ? "md:order-2" : "md:order-1"}>
                <Editable as="p" className={`${eyebrow} mb-7 block`} value={section.eyebrow} {...ep("eyebrow")} placeholder="THE PROBLEM" multiline={false} />
                <Editable as="h2" className="text-[calc(30px*var(--st-fs,1))] md:text-[calc(42px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.25] mb-8 whitespace-pre-line block"
                  value={section.heading} {...ep("heading")} placeholder="왜 작업복은 불편해도 참고 입어야 했을까요?" />
                <Editable as="p" className={`text-[calc(15px*var(--st-fs,1))] md:text-[calc(17px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line block`}
                  value={section.body} {...ep("body")} placeholder="짧은 문제 상황" />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── Work·Life·Wear 3아이콘 특징 ──
    case "features3": {
      const items = section.items ?? [];
      const setItem = (i: number, patch: Partial<FeatureItem>) =>
        edit?.patch({ items: items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
      const addItem = () => edit?.patch({ items: [...items, { icon: "check", label: "NEW", desc: "" }] });
      const delItem = (i: number) => edit?.patch({ items: items.filter((_, idx) => idx !== i) });
      const pickIcon = (i: number) => edit ? () => edit.pickImage((url) => setItem(i, { iconImage: url })) : undefined;
      return (
        // WORK LIFE WEAR — 중앙 정렬. 세로(1900px 기준): 위 60 · eyebrow→제목 18 · 제목(40px)→리드 45 · 리드(20px)→아이콘 45
        //  · 아이콘(70×70)→라벨 29 · 라벨→설명 25 · 아래 66 → 전체 ≈520px. 아이콘 3열은 중앙에 약 300px 간격(max-w-[900px]).
        <section className={bg}>
          <div className="px-[15px] md:px-[70px] text-center pt-16 pb-16 lg:pt-[60px] lg:pb-[66px]">
            <Editable as="p" className={`text-[calc(11px*var(--st-fs,1))] tracking-[0.2em] ${eyebrowColor} uppercase mb-3 lg:mb-[18px] block`}
              value={section.eyebrow} {...ep("eyebrow")} placeholder="WORK LIFE WEAR" multiline={false} />
            <Editable as="h2" className="text-[calc(26px*var(--st-fs,1))] lg:text-[calc(40px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.25] mb-8 lg:mb-[45px] whitespace-pre-line block"
              value={section.heading} {...ep("heading")} placeholder="일할 때는 작업복처럼. 일상에서는 평상복처럼." />
            <Editable as="p" className={`text-[calc(16px*var(--st-fs,1))] lg:text-[calc(20px*var(--st-fs,1))] text-gray-500 ${LH} mb-10 lg:mb-[45px] max-w-[760px] mx-auto whitespace-pre-line block`}
              value={section.lead} {...ep("lead")} placeholder="리드 문장" />
            <div className="mx-auto max-w-[900px] grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6">
              {items.map((it, i) => (
                <div key={i} className="group/item relative flex flex-col items-center text-center">
                  {edit && items.length > 1 && <DelBadge onClick={() => delItem(i)} />}
                  {/* 아이콘 70×70 (커스텀 이미지 우선, 없으면 프리셋). 편집 모드는 클릭해 이미지 교체 */}
                  {edit ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); pickIcon(i)?.(); }}
                      className="group/ic relative w-[70px] h-[70px] flex items-center justify-center text-[#1A2B4A]">
                      {it.iconImage
                        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.iconImage} alt={it.label} className="w-full h-full object-contain" />
                        : <StoryIcon icon={it.icon} className="w-full h-full" />}
                      <span className="pointer-events-none absolute inset-0 rounded-lg bg-black/0 group-hover/ic:bg-black/30 flex items-center justify-center transition-colors">
                        <span className="opacity-0 group-hover/ic:opacity-100 text-white text-[10px] font-semibold">교체</span>
                      </span>
                    </button>
                  ) : (
                    <div className="w-[70px] h-[70px] flex items-center justify-center text-[#1A2B4A]">
                      {it.iconImage
                        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.iconImage} alt={it.label} className="w-full h-full object-contain" />
                        : <StoryIcon icon={it.icon} className="w-full h-full" />}
                    </div>
                  )}
                  <Editable as="h3" className="mt-6 lg:mt-[29px] text-[calc(15px*var(--st-fs,1))] lg:text-[calc(16px*var(--st-fs,1))] font-bold text-[#1A2B4A] tracking-[0.1em] block"
                    value={it.label} placeholder="WORK" multiline={false} {...epi(`items.${i}.label`, edit ? (x) => setItem(i, { label: x }) : undefined)} />
                  <Editable as="p" className={`mt-5 lg:mt-[25px] text-[calc(13px*var(--st-fs,1))] lg:text-[calc(14px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line block`}
                    value={it.desc} placeholder="설명" {...epi(`items.${i}.desc`, edit ? (x) => setItem(i, { desc: x }) : undefined)} />
                </div>
              ))}
            </div>
            {edit && <div className="mt-8 flex justify-center"><AddBtn onClick={addItem} label="항목" /></div>}
          </div>
        </section>
      );
    }

    // ── 매장체험 CTA (사진 콜라주 배경 + 중앙 텍스트/버튼) ──
    case "storeCta": {
      const images = section.images ?? [];
      const setImg = (i: number, url: string) => edit?.patch({ images: images.map((x, idx) => (idx === i ? { ...x, url } : x)) });
      const addImg = () => edit?.patch({ images: [...images, { url: undefined, alt: "" } as PhotoItem] });
      const delImg = (i: number) => edit?.patch({ images: images.filter((_, idx) => idx !== i) });
      const ctaClass =
        "inline-flex items-center gap-2 border border-white text-white text-[calc(12px*var(--st-fs,1))] tracking-widest font-medium px-8 py-3.5 hover:bg-white hover:text-[#1A2B4A] transition-colors";
      const ctaBtn = section.ctaLabel && section.ctaHref
        ? (section.ctaHref.startsWith("/")
          ? <Link href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</Link>
          : <a href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</a>)
        : null;
      return (
        <section className="relative overflow-hidden">
          {/* 배경 콜라주 */}
          <div className="absolute inset-0 grid grid-cols-3">
            {images.length > 0 ? (
              images.map((img, i) => (
                <div key={i} className="group/item relative h-full">
                  {edit && <DelBadge onClick={() => delImg(i)} />}
                  <ImgPick onPick={edit ? () => edit.pickImage((url) => setImg(i, url)) : undefined} has={!!img.url}>
                    {img.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1A2B4A]" />
                    )}
                  </ImgPick>
                </div>
              ))
            ) : (
              <div className="col-span-3 bg-[#1A2B4A]">
                <ImgPick onPick={edit ? () => edit.pickImage((url) => edit.patch({ images: [{ url, alt: "" }] })) : undefined} has={false}>
                  <div className="w-full h-full min-h-[420px]" />
                </ImgPick>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/60" />
          {/* 텍스트 */}
          <div className="relative z-10 px-[15px] md:px-[70px] py-24 md:py-32 text-center">
            <Editable as="p" className={`text-[calc(11px*var(--st-fs,1))] tracking-[0.2em] text-white/60 uppercase mb-7 block`}
              value={section.eyebrow} {...ep("eyebrow")} placeholder="STORE EXPERIENCE" multiline={false} />
            <Editable as="h2" className="text-[calc(28px*var(--st-fs,1))] md:text-[calc(40px*var(--st-fs,1))] font-bold text-white leading-[1.25] mb-6 whitespace-pre-line block"
              value={section.heading} {...ep("heading")} placeholder="입어봐야 알 수 있는 옷이 있습니다." />
            <Editable as="p" className={`text-[calc(14px*var(--st-fs,1))] md:text-[calc(16px*var(--st-fs,1))] text-white/70 ${LH} whitespace-pre-line mb-10 block`}
              value={section.body} {...ep("body")} placeholder="본문" />
            {edit ? (
              <div className="inline-flex flex-col gap-2 items-center">
                <Editable as="span" className={ctaClass} value={section.ctaLabel} {...ep("ctaLabel")} placeholder="버튼 문구" multiline={false} />
                <Editable as="span" className="text-[11px] text-white/50 font-mono border border-dashed border-white/30 rounded px-2 py-1"
                  value={section.ctaHref} {...ep("ctaHref")} placeholder="/store · tel:... · 카카오톡 URL" multiline={false} />
              </div>
            ) : ctaBtn}
            {edit && (
              <div className="mt-8">
                <AddBtn onClick={addImg} label="배경 사진" />
              </div>
            )}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
