import Link from "next/link";
import { DEFAULT_FRANCHISE_GUIDE, type FranchiseGuideConfig } from "@/data/franchise-guide";

// 워크업 창업안내 콘텐츠 (반응형). /franchise 페이지와 문의 페이지 모달에서 공용으로 사용.
// config=편집 텍스트, storeCount=실제 매장 수(계약 가맹수에 실시간 반영), embedded=모달 내부면 하단 CTA 숨김.

// 사진 슬롯 — /public/images/franchise/ 에 파일을 넣으면 자동 노출. 없으면 어두운 패널.
const HERO_IMG = "/images/franchise/hero.jpg";
const TEAM_IMG = "/images/franchise/team.jpg";
const ORANGE = "#ff550c";

function StoreIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke={ORANGE} strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-6.75a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75V21M4.5 21V9.75m15 11.25V9.75M3 9.75l1.35-5.4A1.5 1.5 0 015.8 3.2h12.4a1.5 1.5 0 011.45 1.15L21 9.75m-18 0a2.4 2.4 0 004.5.3 2.4 2.4 0 004.5 0 2.4 2.4 0 004.5 0 2.4 2.4 0 004.5-.3M3 9.75V21h18V9.75M6.75 13.5h3.75v4.5H6.75z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke={ORANGE} strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M6 20v-6m4 6V9m4 11v-8m4 8V6m-1-1l-3 3m3-3h-3m3 0v3" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke={ORANGE} strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

const REQ_ICONS = [<StoreIcon key="s" />, <ChartIcon key="c" />, <PinIcon key="p" />];

const BENEFIT_PATHS = [
  "M9 12.75l2.25 2.25 4.5-4.5m3.75.375c0 5.592-3.824 10.29-9 11.622C6.824 22.29 3 17.592 3 12V6.75c0-.621.504-1.125 1.125-1.125h.375a9.06 9.06 0 007.5-3.086 9.06 9.06 0 007.5 3.086h.375c.621 0 1.125.504 1.125 1.125V12z",
  "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
  "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 010-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.8 3m.37 1.125a23.91 23.91 0 011.014 5.395m0 0a2.62 2.62 0 010 4.16",
];

// 창업 포인트별 미디어(고정): 01 사진 / 02 5km 그래픽 / 03 無·0원 카드
const POINT_MEDIA = [
  <div key="m0" className="h-40 sm:h-full min-h-[150px] rounded-xl bg-[#1a1a1a] bg-cover bg-center" style={{ backgroundImage: `url(${TEAM_IMG})` }} />,
  <div key="m1" className="relative h-40 sm:h-full min-h-[150px] rounded-xl bg-[#141414] overflow-hidden flex items-center justify-center">
    <div className="absolute left-10 right-10 top-1/2 border-t border-dashed border-[#ff550c]/50" />
    <span className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-[#141414] text-xs font-black flex items-center justify-center shadow-lg">W</span>
    <span className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-[#141414] text-xs font-black flex items-center justify-center shadow-lg">W</span>
    <span className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#ff550c] bg-[#141414] flex items-center justify-center text-[#ff550c] text-lg font-bold shadow-[0_0_30px_rgba(255,85,12,0.35)]">5km</span>
  </div>,
  <div key="m2" className="h-40 sm:h-full min-h-[150px] rounded-xl bg-[#141414] flex items-center justify-center gap-3 sm:gap-5 px-4">
    <div className="bg-[#0d0d0d] border border-white/10 rounded-lg px-5 sm:px-6 py-4 text-center">
      <p className="text-3xl sm:text-4xl font-black text-gray-500 leading-none">無</p>
      <p className="text-[10px] text-gray-400 mt-1.5">가맹보증금</p>
    </div>
    <div className="bg-[#0d0d0d] border border-white/10 rounded-lg px-6 sm:px-8 py-4 flex items-end">
      <span className="text-4xl sm:text-5xl font-black text-[#ff550c] leading-none">0</span>
      <span className="text-base sm:text-lg font-bold text-white ml-1 mb-0.5">원</span>
    </div>
  </div>,
];

export default function FranchiseGuide({
  config = DEFAULT_FRANCHISE_GUIDE,
  storeCount = 0,
  embedded = false,
}: { config?: FranchiseGuideConfig; storeCount?: number; embedded?: boolean }) {
  const count = storeCount > 0 ? storeCount : config.count_fallback;

  return (
    <div className="bg-[#0d0d0d] text-white">
      {/* 1. 헤더 (축소) */}
      <section className="bg-[#f5f2ed]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-stretch">
          <div className="px-6 sm:px-10 py-8 md:py-12 flex flex-col justify-center order-2 md:order-1">
            <p className="text-xl sm:text-2xl font-black text-[#111] tracking-tight mb-4">{config.wordmark}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#111] leading-[1.08] mb-4 whitespace-pre-line">
              {config.title}
            </h1>
            <p className="text-sm text-gray-500">{config.subtitle}</p>
            <span className="mt-4 block w-12 h-1 bg-[#ff550c]" />
          </div>
          <div
            className="order-1 md:order-2 min-h-[200px] sm:min-h-[260px] md:min-h-[380px] bg-[#171717] bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMG})` }}
            role="img"
            aria-label="워크업 창업 안내 이미지"
          />
        </div>
      </section>

      {/* 2. 필요조건 / 매출액 / 지역 */}
      <section className="px-4 sm:px-6 lg:px-10 py-10 md:py-14">
        <div className="max-w-6xl mx-auto bg-[#171717] rounded-2xl border border-white/5 p-6 sm:p-8 md:p-10">
          <div className="grid sm:grid-cols-3 gap-8">
            {config.requirements.map((r, i) => (
              <div key={i} className={i > 0 ? "sm:pl-8 sm:border-l sm:border-white/10" : ""}>
                <div className="flex items-center gap-2.5 mb-4">
                  {REQ_ICONS[i]}
                  <h3 className="text-lg font-bold text-white">{r.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {r.items.map((it, j) => (
                    <li key={j} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                      <span className="text-[#ff550c] mt-px">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 창업 포인트 */}
      <section className="px-4 sm:px-6 lg:px-10 pb-8 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-9 md:mb-12">
            <p className="text-[11px] tracking-[0.25em] text-[#ff550c] font-bold mb-2.5">WORKUP&apos;S STRENGTH POINT</p>
            <div className="flex items-center justify-center gap-4">
              <span className="hidden sm:block h-px w-14 bg-white/20" />
              <h2 className="text-2xl sm:text-3xl font-black text-white">워크업 창업 포인트</h2>
              <span className="hidden sm:block h-px w-14 bg-white/20" />
            </div>
          </div>

          <div className="space-y-4">
            {config.points.map((p, i) => (
              <PointRow key={i} no={String(i + 1).padStart(2, "0")} title={p.title} desc={p.desc}>
                {POINT_MEDIA[i]}
              </PointRow>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 가맹수 (실제 매장 수 실시간) */}
      <section className="bg-[#1a1a1a] py-8 md:py-10 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
          <span className="text-xl sm:text-3xl font-bold text-white">{config.cta_prefix}</span>
          <span className="text-4xl sm:text-6xl font-black text-[#ff550c] leading-none">{count.toLocaleString()}</span>
          <span className="text-xl sm:text-3xl font-bold text-white">{config.cta_suffix}</span>
        </div>
      </section>

      {/* 5. 하단 혜택 */}
      <section className="px-6 py-10 md:py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
          {config.benefits.map((b, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <svg className="w-9 h-9 text-[#ff550c]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={BENEFIT_PATHS[i]} />
              </svg>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {b.line1}<br />{b.line2}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. 문의 CTA (모달 내부에서는 숨김) */}
      {!embedded && (
        <section className="px-6 pb-16 md:pb-20 text-center">
          <p className="text-sm text-gray-400 mb-5">워크업 창업, 지금 바로 상담받아 보세요.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/partnership/franchise"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#ff550c] text-white text-sm font-bold px-8 py-4 rounded-full hover:bg-[#e04a08] transition-colors">
              가맹·창업 문의하기 →
            </Link>
            <Link href="/store"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 text-white text-sm font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors">
              매장 찾기
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// 창업 포인트 한 줄 (좌: 번호·문구 / 우: 미디어). 모바일에서 세로 스택.
function PointRow({ no, title, desc, children }: { no: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#171717] border border-white/5 p-5 sm:p-6 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-5 md:gap-8 md:items-center">
      <div className="flex gap-4 sm:gap-5">
        <span className="text-3xl sm:text-4xl font-black text-[#ff550c] leading-none flex-shrink-0">{no}</span>
        <div className="border-l border-white/10 pl-4 sm:pl-5">
          <h3 className="text-lg sm:text-xl font-bold text-white whitespace-pre-line leading-snug mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-400 whitespace-pre-line leading-relaxed">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
