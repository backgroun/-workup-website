import Link from "next/link";
import { DEFAULT_FRANCHISE_GUIDE, styleCss, type FranchiseGuideConfig } from "@/data/franchise-guide";

// 워크업 창업안내 콘텐츠 (반응형). /franchise 페이지와 문의 페이지 모달에서 공용.
// config=편집 텍스트/스타일/색, storeCount=실제 매장 수, embedded=모달 내부면 하단 CTA 숨김, onClose=모달일 때 닫기 버튼.

const LINE = "#2a2a2a";

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
      {/* 브랜드바 */}
      <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4 sm:py-5 border-b border-black/10" style={{ backgroundColor: col.header_bg }}>
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-wrap">
          <span className="font-black whitespace-nowrap" style={styleCss(s.wordmark)}>{config.wordmark}</span>
          <span className="font-black whitespace-nowrap" style={styleCss(s.title)}>{config.title}</span>
          <span className="hidden sm:inline whitespace-nowrap" style={styleCss(s.subtitle)}>{config.subtitle}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="창업안내 닫기"
            className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#66635f] text-white flex items-center justify-center text-xl leading-none hover:bg-black hover:rotate-6 transition-all"
          >
            ×
          </button>
        )}
      </div>

      {/* 히어로 */}
      <section className="grid md:grid-cols-[1.15fr_.85fr] gap-6 md:gap-7 items-stretch px-5 sm:px-8 md:px-10 py-8 md:py-10 border-b" style={{ borderColor: LINE }}>
        <div className="flex flex-col justify-center">
          <p className="font-black mb-3" style={styleCss(s.hero_eyebrow)}>{config.hero_eyebrow}</p>
          <h1 className="font-black whitespace-pre-line" style={styleCss(s.hero_title)}>{config.hero_title}</h1>
          <p className="mt-4 max-w-[36rem]" style={{ ...styleCss(s.hero_desc), wordBreak: "keep-all" }}>{heroDesc}</p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link
              href="/partnership/franchise"
              style={{ backgroundColor: col.accent }}
              className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl text-white text-sm font-extrabold hover:opacity-90 hover:-translate-y-0.5 transition-all"
            >
              {config.hero_primary_label}
            </Link>
            <a
              href="#conditions"
              className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-[#3b3b3b] text-white text-sm font-extrabold hover:border-[#666] hover:bg-white/5 hover:-translate-y-0.5 transition-all"
            >
              {config.hero_secondary_label}
            </a>
          </div>
        </div>

        <div
          className="hidden md:block relative min-h-[300px] rounded-2xl overflow-hidden border border-white/5"
          style={{ background: `radial-gradient(circle at 70% 25%, ${col.accent}47 0%, transparent 22%), linear-gradient(135deg, #242424, #111 65%)` }}
          aria-hidden="true"
        >
          <div
            className="absolute rounded-2xl border border-white/10"
            style={{ width: "58%", height: "68%", left: "10%", bottom: "10%", transform: "rotate(-4deg)", background: "linear-gradient(145deg, #262626, #171717)", boxShadow: "0 20px 40px rgba(0,0,0,.25)" }}
          />
          <div
            className="absolute rounded-2xl"
            style={{ width: "48%", height: "56%", right: "8%", top: "13%", transform: "rotate(7deg)", background: "linear-gradient(145deg, #262626, #171717)", border: `1px solid ${col.accent}59`, boxShadow: "0 20px 40px rgba(0,0,0,.25)" }}
          />
          <div className="absolute left-5 bottom-5 z-[2] text-white font-black">
            <small className="block mb-1.5 font-bold" style={{ color: col.accent, fontSize: 11, letterSpacing: ".14em" }}>{config.hero_visual_label}</small>
            {config.hero_visual_text}
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
