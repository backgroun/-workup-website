import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "STORY — 브랜드 철학 | WORKUP",
  description: "워크업이 왜 존재하는가. 일하는 사람을 위한 브랜드의 철학.",
};

const values = [
  {
    num: "01",
    title: "기능성",
    en: "Function",
    desc: "현장에서 검증된 설계.\n사무실이 아니라 실제 작업 환경에서 만들어집니다.",
  },
  {
    num: "02",
    title: "내구성",
    en: "Durability",
    desc: "오래 입을수록 가치 있는 옷.\n한 철 입고 버리는 옷이 아닙니다.",
  },
  {
    num: "03",
    title: "합리성",
    en: "Value",
    desc: "품질 대비 납득 가능한 가격.\n일하는 사람이 부담 없이 살 수 있어야 합니다.",
  },
  {
    num: "04",
    title: "범용성",
    en: "Versatility",
    desc: "현장에도, 퇴근 후에도.\n옷을 갈아입을 시간이 없어도 됩니다.",
  },
];

export default function StoryPage() {
  return (
    <main className="bg-white">

      {/* ── 히어로 이미지 ── */}
      <div
        className="relative w-full bg-[#1A2B4A] overflow-hidden"
        style={{ height: "580px" }}
      >
        {/* WU 워터마크 */}
        <div className="absolute inset-0 flex items-center justify-end pr-16 opacity-[0.04] select-none pointer-events-none">
          <span className="text-white font-black leading-none" style={{ fontSize: "320px" }}>WU</span>
        </div>
        {/* 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

        {/* 텍스트 — 좌하단 */}
        <div className="absolute bottom-12 px-[15px] md:px-[70px]">
          <h1 className="text-[38px] md:text-[54px] font-bold text-white leading-[1.15] mb-5">
            일하는 사람 편에서<br />만든 브랜드
          </h1>
          <p className="text-white/60 text-[14px]">워크업이 왜 존재하는가</p>
        </div>
      </div>

      {/* ── 브랜드 선언문 ── */}
      <section className="py-24 bg-white">
        <div className="px-[15px] md:px-[70px]">
          <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-7">Brand Declaration</p>
          <div className="max-w-2xl">
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#1A2B4A] leading-tight mb-8">
              대한민국에는<br />수많은 사람이 일합니다.
            </h2>
            <p className="text-[16px] text-gray-600 leading-loose mb-8">
              건설현장, 공장, 물류센터, 농장, 매장, 사무실까지.
            </p>
            <div className="w-8 h-[2px] bg-[#1A2B4A] mb-8" />
            <p className="text-[18px] md:text-[21px] text-[#1A2B4A] leading-relaxed font-medium">
              그들이 더 편하게, 더 안전하게, 더 합리적으로<br />
              일할 수 있도록 —<br />
              <span className="font-bold">워크업이 존재합니다.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Work Life Wear ── */}
      <section className="py-24 bg-[#f2f1ed]">
        <div className="px-[15px] md:px-[70px]">
          <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase mb-7">Our Category</p>
          <h2 className="text-[40px] md:text-[52px] font-bold text-[#1A2B4A] leading-tight mb-8">
            Work Life Wear
          </h2>
          <p className="text-[17px] text-gray-600 leading-relaxed mb-10">
            우리는 작업복 브랜드가 아닙니다.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-10">
            {["Workwear", "Dailywear", "Functionalwear"].map((word, i) => (
              <div key={word} className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#1A2B4A] tracking-wider border border-[#1A2B4A] px-4 py-2">
                  {word}
                </span>
                {i < 2 && <span className="text-gray-400 text-xl font-light">+</span>}
              </div>
            ))}
          </div>
          <p className="text-[14px] text-gray-600 leading-loose max-w-md">
            일하는 삶 전체를 함께하는 브랜드.<br />
            현장의 기능과 일상의 스타일을 동시에 담습니다.
          </p>
        </div>
      </section>

      {/* ── 핵심 가치 ── */}
      <section className="py-24 bg-white">
        <div className="px-[15px] md:px-[70px]">
          <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-7">Core Values</p>
          <h2 className="text-[28px] font-bold text-[#1A2B4A] mb-14">워크업이 지키는 네 가지</h2>

          {/* gap-px + bg-gray-200 = 1px 그리드 라인 효과 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
            {values.map((v) => (
              <div key={v.num} className="bg-white p-8">
                <p className="text-[38px] font-bold text-[#1A2B4A] leading-none mb-6 opacity-10">
                  {v.num}
                </p>
                <p className="text-[10px] tracking-[0.18em] text-gray-400 uppercase mb-2">{v.en}</p>
                <h3 className="text-[18px] font-bold text-[#1A2B4A] mb-4">{v.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-line">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 창업 스토리 ── */}
      <section className="py-24 bg-[#f2f1ed]">
        <div className="px-[15px] md:px-[70px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">

            {/* 텍스트 */}
            <div>
              <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase mb-7">Founding Story</p>
              <h2 className="text-[28px] font-bold text-[#1A2B4A] leading-snug mb-9">
                왜 작업복인가
              </h2>
              <div className="space-y-5 text-[13px] text-gray-600 leading-[1.9]">
                <p>워크업은 하나의 질문에서 시작했습니다.</p>
                <p className="text-[15px] font-semibold text-[#1A2B4A]">
                  "왜 일하는 사람은 좋은 옷을 포기해야 할까?"
                </p>
                <p>
                  기능이 좋으면 비싸고, 가격이 싸면 금방 망가지고,
                  디자인이 좋으면 현장에서 쓸 수 없었습니다.
                </p>
                <p>
                  워크업은 그 셋을 같이 잡기로 했습니다.
                  현장에서 쓸 수 있고, 퇴근 후에도 입을 수 있고,
                  지갑이 부담스럽지 않은 옷.
                </p>
                <p className="font-medium text-[#1A2B4A]">
                  일하는 사람 편에서 만든 옷,<br />
                  그게 워크업입니다.
                </p>
              </div>
            </div>

            {/* 이미지 플레이스홀더 */}
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

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="px-[15px] md:px-[70px]">
          <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-6">Experience WORKUP</p>
          <h2 className="text-[26px] font-bold text-[#1A2B4A] mb-4">
            워크업을 직접 경험하세요.
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
            화면으로는 전할 수 없는 것들이 있습니다.<br />
            가까운 매장에서 직접 확인해 보세요.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-[12px] tracking-widest font-medium px-8 py-3.5 hover:bg-[#1A2B4A] hover:text-white transition-colors"
          >
            가까운 매장 찾기 →
          </Link>
        </div>
      </section>

    </main>
  );
}
