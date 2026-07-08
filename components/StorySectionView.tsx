"use client";
import Link from "next/link";
import type { StorySection, SectionBg } from "@/data/story";

// /story 본문 섹션 한 개. 공개 페이지와 관리자 미리보기에서 공용으로 사용(DRY) → 시각 회귀 불가능.
// 크기·여백·줄간격·이미지 비율/너비는 부모(공개 페이지·관리자 미리보기)가 주입하는 CSS 변수로 제어한다.
//   --st-fs  : 폰트 배율(기본 1)   --st-lh  : 본문 줄간격(기본 1.8)   --st-sp : 섹션 여백 배율(기본 1)
//   --st-ratio: 이미지 비율(기본 4/3)   --st-imgcol/--st-textcol : 이미지·텍스트 컬럼 비중(기본 1fr)
// 변수가 없어도 calc 폴백(,1 등)으로 기존 디자인과 동일하게 렌더된다.

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  beige: "bg-[#f2f1ed]",
};

// 반복되는 토큰 클래스(리터럴이라 Tailwind JIT가 정상 추출)
const SEC = "py-[calc(6rem*var(--st-sp,1))] md:py-[calc(8rem*var(--st-sp,1))]";
const SEC_CTA = "py-[calc(5rem*var(--st-sp,1))] md:py-[calc(7rem*var(--st-sp,1))]";
const GRID = "grid grid-cols-1 gap-12 md:gap-20 items-center";
const COLS_TEXT_IMG = "md:grid-cols-[var(--st-textcol,1fr)_var(--st-imgcol,1fr)]"; // 텍스트 좌 · 이미지 우
const COLS_IMG_TEXT = "md:grid-cols-[var(--st-imgcol,1fr)_var(--st-textcol,1fr)]"; // 이미지 좌 · 텍스트 우
const LH = "leading-[var(--st-lh,1.8)]";
const IMG_RATIO = "var(--st-ratio, 4 / 3)";

// 선언문·카테고리 대형 이미지 패널. 이미지가 없으면 네이비 + WU 워터마크로 채워 허전함을 막는다.
// 비율은 --st-ratio 로 제어하고, 인물 얼굴이 잘리지 않게 상단 기준으로 크롭한다.
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

export default function StorySectionView({ section }: { section: StorySection }) {
  const bg = BG_CLASS[section.bg] ?? "bg-white";
  // eyebrow(작은 영문 라벨) 색을 배경에 맞춰 대비 확보 — 흰 배경=gray-400(원본), 베이지=gray-500(원본)
  const eyebrowColor = section.bg === "beige" ? "text-gray-500" : "text-gray-400";
  const eyebrow = `text-[calc(11px*var(--st-fs,1))] tracking-[0.2em] ${eyebrowColor} uppercase`;

  switch (section.type) {
    // ── 브랜드 선언문 (데스크톱: 큰 텍스트 좌 · 대형 이미지 우) ──
    case "declaration":
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className={`${GRID} ${COLS_TEXT_IMG}`}>
              {/* 텍스트 */}
              <div>
                <p className={`${eyebrow} mb-8`}>{section.eyebrow}</p>
                <h2 className="text-[calc(36px*var(--st-fs,1))] md:text-[calc(54px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.12] mb-9 whitespace-pre-line">
                  {section.heading}
                </h2>
                {section.lead && <p className={`text-[calc(16px*var(--st-fs,1))] md:text-[calc(18px*var(--st-fs,1))] text-gray-600 ${LH} mb-8`}>{section.lead}</p>}
                <div className="w-10 h-[3px] bg-[#1A2B4A] mb-8" />
                <p className="text-[calc(19px*var(--st-fs,1))] md:text-[calc(26px*var(--st-fs,1))] text-[#1A2B4A] leading-[1.5] font-medium whitespace-pre-line">
                  {section.emphasis}
                  {section.emphasisStrong && (
                    <>
                      {"\n"}
                      <span className="font-bold">{section.emphasisStrong}</span>
                    </>
                  )}
                </p>
              </div>
              {/* 이미지 */}
              <div>
                <StoryImagePanel src={section.image_url} alt={section.heading || "브랜드 선언"} />
              </div>
            </div>
          </div>
        </section>
      );

    // ── Work Life Wear / Our Category (데스크톱: 대형 이미지 좌 · 큰 헤드+태그+본문 우) ──
    case "category":
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className={`${GRID} ${COLS_IMG_TEXT}`}>
              {/* 이미지 (좌) */}
              <div className="md:order-1 order-2">
                <StoryImagePanel src={section.image_url} alt={section.heading || "Work Life Wear"} />
              </div>
              {/* 텍스트 (우) */}
              <div className="md:order-2 order-1">
                <p className={`${eyebrow} mb-7`}>{section.eyebrow}</p>
                <h2 className="text-[calc(44px*var(--st-fs,1))] md:text-[calc(64px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.03] mb-8">{section.heading}</h2>
                {section.lead && <p className={`text-[calc(18px*var(--st-fs,1))] md:text-[calc(21px*var(--st-fs,1))] text-gray-600 ${LH} mb-10`}>{section.lead}</p>}
                <div className="flex flex-wrap items-center gap-3 mb-10">
                  {(section.tags ?? []).filter(Boolean).map((word, i, arr) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[calc(13px*var(--st-fs,1))] md:text-[calc(15px*var(--st-fs,1))] font-bold text-[#1A2B4A] tracking-wider border border-[#1A2B4A] px-5 py-2.5">
                        {word}
                      </span>
                      {i < arr.length - 1 && <span className="text-gray-400 text-xl font-light">+</span>}
                    </div>
                  ))}
                </div>
                {section.body && (
                  <p className={`text-[calc(15px*var(--st-fs,1))] md:text-[calc(16px*var(--st-fs,1))] text-gray-600 ${LH} whitespace-pre-line`}>{section.body}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    // ── 핵심 가치 ──
    case "values":
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <p className={`${eyebrow} mb-7`}>{section.eyebrow}</p>
            <h2 className="text-[calc(28px*var(--st-fs,1))] md:text-[calc(36px*var(--st-fs,1))] font-bold text-[#1A2B4A] mb-14">{section.heading}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
              {(section.items ?? []).map((v, i) => (
                <div key={i} className="bg-white p-6 md:p-9">
                  <p className="text-[calc(38px*var(--st-fs,1))] md:text-[calc(46px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-none mb-6 opacity-10">{v.num}</p>
                  <p className="text-[calc(10px*var(--st-fs,1))] tracking-[0.18em] text-gray-400 uppercase mb-2">{v.en}</p>
                  <h3 className="text-[calc(18px*var(--st-fs,1))] md:text-[calc(20px*var(--st-fs,1))] font-bold text-[#1A2B4A] mb-4">{v.title}</h3>
                  <p className={`text-[calc(13px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line`}>{v.desc}</p>
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
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className={`${GRID} md:grid-cols-2`}>
              {/* 텍스트 */}
              <div className={imageLeft ? "md:order-2" : ""}>
                <p className={`${eyebrow} mb-7`}>{section.eyebrow}</p>
                <h2 className="text-[calc(28px*var(--st-fs,1))] md:text-[calc(38px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-snug mb-9 whitespace-pre-line">
                  {section.heading}
                </h2>
                <div className={`space-y-5 text-[calc(13px*var(--st-fs,1))] md:text-[calc(15px*var(--st-fs,1))] text-gray-600 ${LH}`}>
                  {paras[0] && <p>{paras[0]}</p>}
                  {section.emphasis && (
                    <p className="text-[calc(15px*var(--st-fs,1))] font-semibold text-[#1A2B4A]">{section.emphasis}</p>
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
                    className="w-full h-full object-cover object-top"
                    style={{ aspectRatio: IMG_RATIO }}
                  />
                ) : (
                  <div
                    className="bg-[#1A2B4A] flex flex-col items-center justify-center gap-3"
                    style={{ aspectRatio: IMG_RATIO }}
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
        "inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-[calc(12px*var(--st-fs,1))] tracking-widest font-medium px-8 py-3.5 hover:bg-[#1A2B4A] hover:text-white transition-colors";
      const ctaBtn =
        section.ctaLabel && section.ctaHref ? (
          section.ctaHref.startsWith("/") ? (
            <Link href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</Link>
          ) : (
            <a href={section.ctaHref} className={ctaClass}>{section.ctaLabel}</a>
          )
        ) : null;
      return (
        <section className={`${SEC_CTA} ${bg} border-t border-gray-100`}>
          <div className="px-[15px] md:px-[70px]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <p className={`${eyebrow} mb-6`}>{section.eyebrow}</p>
                <h2 className="text-[calc(26px*var(--st-fs,1))] md:text-[calc(36px*var(--st-fs,1))] font-bold text-[#1A2B4A] mb-4">{section.heading}</h2>
                {section.body && (
                  <p className={`text-[calc(13px*var(--st-fs,1))] md:text-[calc(15px*var(--st-fs,1))] text-gray-500 ${LH} whitespace-pre-line`}>{section.body}</p>
                )}
              </div>
              {ctaBtn && <div className="md:shrink-0">{ctaBtn}</div>}
            </div>
          </div>
        </section>
      );
    }

    // ── 자유 텍스트 (데스크톱 2컬럼: 제목 좌 · 본문 우) ──
    case "richtext":
      return (
        <section className={`${SEC} ${bg}`}>
          <div className="px-[15px] md:px-[70px]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 md:gap-x-16">
              <div className="md:col-span-5">
                <p className={`${eyebrow} mb-7`}>{section.eyebrow}</p>
                <h2 className="text-[calc(32px*var(--st-fs,1))] md:text-[calc(44px*var(--st-fs,1))] font-bold text-[#1A2B4A] leading-[1.15] whitespace-pre-line">
                  {section.heading}
                </h2>
              </div>
              {section.body && (
                <div className="md:col-span-6 md:col-start-7 md:pt-2">
                  <p className={`text-[calc(16px*var(--st-fs,1))] md:text-[calc(17px*var(--st-fs,1))] text-gray-600 ${LH} whitespace-pre-line`}>{section.body}</p>
                </div>
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
