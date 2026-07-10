import Link from "next/link";
import { DEFAULT_FRANCHISE_GUIDE, styleCss, type FranchiseGuideConfig } from "@/data/franchise-guide";

// 워크업 창업안내 콘텐츠 (반응형). /franchise 페이지와 문의 페이지 모달에서 공용.
// config=편집 텍스트/스타일/색, storeCount=실제 매장 수, embedded=모달 내부면 하단 CTA 숨김, onClose=모달일 때 닫기 버튼.

const LINE = "#2a2a2a";

// 모바일에서 더 작아지고 데스크톱에서 설정값(size)에 도달하는 반응형 폰트 크기
function fluidStyle(min: number, vw: number, base: { size: number; color: string; tracking: number; leading: number }) {
  return {
    fontSize: `clamp(${min}px, ${vw}vw, ${base.size}px)`,
    color: base.color,
    letterSpacing: `${base.tracking}em`,
    lineHeight: base.leading,
  };
}

export default function FranchiseGuide({
  config = DEFAULT_FRANCHISE_GUIDE,
  storeCount = 0,
  embedded = false,
  onClose,
}: { config?: FranchiseGuideConfig; storeCount?: number; embedded?: boolean; onClose?: () => void }) {
  const s = config.styles;
  const col = config.colors;
  const count = storeCount > 0 ? storeCount : config.count_fallback;
  const heroDesc = config.hero_desc.replace("{count}", count.toLocaleString());
  const stats = [...config.stats, { value: `${count.toLocaleString()}${config.store_stat_unit}`, label: config.store_stat_label }];

  return (
    <div style={{ backgroundColor: col.page_bg }}>
      {/* 상단 슬림바 (모바일 39px / PC 60px) — 스크롤 시 상단 고정 */}
      <style>{`
        .wu-fg-title{font-size:${s.title.size}px}
        @media(min-width:768px){.wu-fg-title{font-size:${Math.round(s.title.size * 1.6)}px}}
      `}</style>
      <div className="sticky top-0 z-20 flex items-center justify-between h-[39px] md:h-[60px] px-4 sm:px-6 border-b border-black/10" style={{ backgroundColor: col.header_bg }}>
        <span
          className="wu-fg-title font-bold whitespace-nowrap truncate text-left flex-1 min-w-0"
          style={{ color: s.title.color, letterSpacing: `${s.title.tracking}em`, lineHeight: s.title.leading }}
        >
          {config.title}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="창업안내 닫기"
            className="flex-shrink-0 w-[26px] h-[26px] rounded-full bg-[#66635f] text-white flex items-center justify-center text-sm leading-none hover:bg-black transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* 히어로 — 전체 배경 이미지 */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: LINE }}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ background: config.hero_bg_img ? `url(${config.hero_bg_img}) center / cover no-repeat` : "linear-gradient(135deg, #242424, #111 65%)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.82))" }} aria-hidden="true" />

        <div className="relative z-10 px-5 sm:px-8 md:px-10 py-12 sm:py-16 md:py-24">
          <p className="font-black mb-3" style={styleCss(s.hero_eyebrow)}>{config.hero_eyebrow}</p>
          <h1 className="font-medium whitespace-pre-line max-w-2xl" style={fluidStyle(22, 8, s.hero_title)}>{config.hero_title}</h1>
          <p className="mt-4 max-w-xl whitespace-pre-line" style={{ ...fluidStyle(13, 3.6, s.hero_desc), wordBreak: "keep-all" }}>{heroDesc}</p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <a
              href="#conditions"
              className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-white/30 text-white text-sm font-extrabold hover:border-white/60 hover:bg-white/10 hover:-translate-y-0.5 transition-all"
            >
              {config.hero_secondary_label}
            </a>
          </div>
        </div>
      </section>

      {/* 핵심 수치 3분할 */}
      <section className="grid grid-cols-3 border-b" style={{ borderColor: LINE }} aria-label="워크업 창업 핵심 수치">
        {stats.map((st, i) => (
          <div
            key={i}
            className={"text-center py-5 sm:py-6 px-2 sm:px-4" + (i > 0 ? " border-l" : "")}
            style={i > 0 ? { borderColor: LINE } : undefined}
          >
            <strong className="block mb-1.5 font-black" style={styleCss(s.stat_value)}>{st.value}</strong>
            <span style={styleCss(s.stat_label)}>{st.label}</span>
          </div>
        ))}
      </section>

      {/* 워크업 창업이 다른 이유 */}
      <section className="px-5 sm:px-8 md:px-10 py-8 md:py-10 border-b" style={{ borderColor: LINE }}>
        <div className="mb-5 md:mb-6">
          <h2 className="font-black" style={styleCss(s.section_title)}>{config.section_title}</h2>
          <p className="mt-2" style={styleCss(s.section_desc)}>{config.section_desc}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3.5">
          {config.benefits.map((b, i) => (
            <article key={i} className="rounded-2xl border border-white/5 p-5 sm:p-6" style={{ backgroundColor: col.card_bg }}>
              <span className="inline-flex mb-5 font-black" style={styleCss(s.benefit_num)}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-bold mb-2.5" style={styleCss(s.benefit_title)}>{b.title}</h3>
              <p style={{ ...styleCss(s.benefit_desc), wordBreak: "keep-all" }}>{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 창업 기본 조건 */}
      <section id="conditions" className="px-5 sm:px-8 md:px-10 py-8 md:py-10 border-b" style={{ borderColor: LINE }}>
        <div className="mb-5 md:mb-6">
          <h2 className="font-black" style={styleCss(s.section_title)}>{config.conditions_title}</h2>
          <p className="mt-2" style={styleCss(s.section_desc)}>{config.conditions_desc}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 border-t" style={{ borderColor: LINE }}>
          {config.conditions.map((row, i) => (
            <div key={i} className="flex justify-between gap-4 py-4 border-b" style={{ borderColor: LINE }}>
              <span style={styleCss(s.condition_label)}>{row.label}</span>
              <strong className="text-right font-bold" style={styleCss(s.condition_value)}>{row.value}</strong>
            </div>
          ))}
        </div>
        <p className="mt-4" style={styleCss(s.notice)}>{config.notice}</p>
      </section>

      {/* CTA */}
      {!embedded && (
        <section
          className="px-5 sm:px-8 md:px-10 py-7 md:py-9 flex flex-col md:flex-row items-center md:justify-between gap-5 md:gap-6"
          style={{ background: "linear-gradient(135deg, #1f1f1f, #141414)" }}
        >
          <div className="text-center md:text-left">
            <h2 className="font-black mb-1.5" style={styleCss(s.cta_title)}>{config.cta_title}</h2>
            <p style={styleCss(s.cta_desc)}>{config.cta_desc}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Link
              href="/partnership/franchise"
              style={{ backgroundColor: col.accent }}
              className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl text-white text-sm font-extrabold hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              {config.cta_button_label}
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              매장 찾기
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
