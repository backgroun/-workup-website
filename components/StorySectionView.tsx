"use client";
import Link from "next/link";
import type { StorySection, SectionBg } from "@/data/story";

// /story 본문 섹션 한 개. 공개 페이지와 관리자 미리보기에서 공용으로 사용(DRY) → 시각 회귀 불가능.
// 각 case 는 현재 app/story/page.tsx 의 <section> JSX 를 그대로 옮긴 것. <br/> 는 whitespace-pre-line + \n 으로 대체.

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  beige: "bg-[#f2f1ed]",
};

export default function StorySectionView({ section }: { section: StorySection }) {
  const bg = BG_CLASS[section.bg] ?? "bg-white";
  // eyebrow(작은 영문 라벨) 색을 배경에 맞춰 대비 확보 — 흰 배경=gray-400(원본), 베이지=gray-500(원본)
  const eyebrowColor = section.bg === "beige" ? "text-gray-500" : "text-gray-400";

  switch (section.type) {
    // ── 브랜드 선언문 ──
    case "declaration":
      return (
        <section className={`py-24 ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <p className={`text-[11px] tracking-[0.2em] ${eyebrowColor} uppercase mb-7`}>{section.eyebrow}</p>
            <div className="max-w-2xl">
              <h2 className="text-[32px] md:text-[40px] font-bold text-[#1A2B4A] leading-tight mb-8 whitespace-pre-line">
                {section.heading}
              </h2>
              {section.lead && <p className="text-[16px] text-gray-600 leading-loose mb-8">{section.lead}</p>}
              <div className="w-8 h-[2px] bg-[#1A2B4A] mb-8" />
              <p className="text-[18px] md:text-[21px] text-[#1A2B4A] leading-relaxed font-medium whitespace-pre-line">
                {section.emphasis}
                {section.emphasisStrong && (
                  <>
                    {"\n"}
                    <span className="font-bold">{section.emphasisStrong}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </section>
      );

    // ── Work Life Wear / Our Category ──
    case "category":
      return (
        <section className={`py-24 ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <p className={`text-[11px] tracking-[0.2em] ${eyebrowColor} uppercase mb-7`}>{section.eyebrow}</p>
            <h2 className="text-[40px] md:text-[52px] font-bold text-[#1A2B4A] leading-tight mb-8">{section.heading}</h2>
            {section.lead && <p className="text-[17px] text-gray-600 leading-relaxed mb-10">{section.lead}</p>}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              {(section.tags ?? []).filter(Boolean).map((word, i, arr) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-[#1A2B4A] tracking-wider border border-[#1A2B4A] px-4 py-2">
                    {word}
                  </span>
                  {i < arr.length - 1 && <span className="text-gray-400 text-xl font-light">+</span>}
                </div>
              ))}
            </div>
            {section.body && (
              <p className="text-[14px] text-gray-600 leading-loose max-w-md whitespace-pre-line">{section.body}</p>
            )}
          </div>
        </section>
      );

    // ── 핵심 가치 ──
    case "values":
      return (
        <section className={`py-24 ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <p className={`text-[11px] tracking-[0.2em] ${eyebrowColor} uppercase mb-7`}>{section.eyebrow}</p>
            <h2 className="text-[28px] font-bold text-[#1A2B4A] mb-14">{section.heading}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
              {(section.items ?? []).map((v, i) => (
                <div key={i} className="bg-white p-8">
                  <p className="text-[38px] font-bold text-[#1A2B4A] leading-none mb-6 opacity-10">{v.num}</p>
                  <p className="text-[10px] tracking-[0.18em] text-gray-400 uppercase mb-2">{v.en}</p>
                  <h3 className="text-[18px] font-bold text-[#1A2B4A] mb-4">{v.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-line">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    // ── 창업 스토리 (2단: 텍스트 + 이미지) ──
    case "founding": {
      const imageLeft = section.imageSide === "left";
      const paras = section.paragraphs ?? [];
      return (
        <section className={`py-24 ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
              {/* 텍스트 */}
              <div className={imageLeft ? "md:order-2" : ""}>
                <p className={`text-[11px] tracking-[0.2em] ${eyebrowColor} uppercase mb-7`}>{section.eyebrow}</p>
                <h2 className="text-[28px] font-bold text-[#1A2B4A] leading-snug mb-9 whitespace-pre-line">
                  {section.heading}
                </h2>
                <div className="space-y-5 text-[13px] text-gray-600 leading-[1.9]">
                  {paras[0] && <p>{paras[0]}</p>}
                  {section.emphasis && (
                    <p className="text-[15px] font-semibold text-[#1A2B4A]">{section.emphasis}</p>
                  )}
                  {paras.slice(1).map((para, i) => (para ? <p key={i}>{para}</p> : null))}
                  {section.closing && (
                    <p className="font-medium text-[#1A2B4A] whitespace-pre-line">{section.closing}</p>
                  )}
                </div>
              </div>

              {/* 이미지 */}
              <div className={imageLeft ? "md:order-1" : ""}>
                {section.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={section.image_url}
                    alt={section.heading || "창업 스토리"}
                    className="w-full object-cover"
                    style={{ aspectRatio: "4 / 3" }}
                  />
                ) : (
                  <div
                    className="bg-[#1A2B4A] flex flex-col items-center justify-center gap-3"
                    style={{ aspectRatio: "4 / 3" }}
                  >
                    <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white/25 text-[11px] tracking-widest uppercase">사진을 교체해 주세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── 매장 유도 CTA ──
    case "cta": {
      const ctaClass =
        "inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-[12px] tracking-widest font-medium px-8 py-3.5 hover:bg-[#1A2B4A] hover:text-white transition-colors";
      return (
        <section className={`py-20 ${bg} border-t border-gray-100`}>
          <div className="px-[15px] md:px-[70px]">
            <p className={`text-[11px] tracking-[0.2em] ${eyebrowColor} uppercase mb-6`}>{section.eyebrow}</p>
            <h2 className="text-[26px] font-bold text-[#1A2B4A] mb-4">{section.heading}</h2>
            {section.body && (
              <p className="text-[13px] text-gray-500 leading-relaxed mb-8 whitespace-pre-line">{section.body}</p>
            )}
            {section.ctaLabel && section.ctaHref && (
              section.ctaHref.startsWith("/") ? (
                <Link href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</Link>
              ) : (
                <a href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</a>
              )
            )}
          </div>
        </section>
      );
    }

    // ── 자유 텍스트 (선언문 셸 재사용) ──
    case "richtext":
      return (
        <section className={`py-24 ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <p className={`text-[11px] tracking-[0.2em] ${eyebrowColor} uppercase mb-7`}>{section.eyebrow}</p>
            <div className="max-w-2xl">
              <h2 className="text-[32px] md:text-[40px] font-bold text-[#1A2B4A] leading-tight mb-8 whitespace-pre-line">
                {section.heading}
              </h2>
              {section.body && (
                <p className="text-[16px] text-gray-600 leading-loose whitespace-pre-line">{section.body}</p>
              )}
            </div>
          </div>
        </section>
      );

    // ── 사진 갤러리 (하단 이미지 그리드) ──
    case "photos": {
      const cols = section.columns ?? 3;
      const colClass: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4" };
      const imgSize = Math.floor(1920 / cols);
      return (
        <section className={`${bg}`}>
          <div className={`grid ${colClass[cols] ?? "grid-cols-3"} gap-1`}>
            {section.images.map((img, i) =>
              img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.url}
                  alt={img.alt || ""}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div key={i} className="w-full aspect-square bg-gray-100 flex flex-col items-center justify-center gap-1">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[10px] text-gray-300 tracking-wider">
                    {imgSize} × {imgSize}px
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
