import Link from "next/link";
import type { PartnerInfo } from "@/data/partnership";
import InquiryBoard from "./InquiryBoard";

// 가맹·창업 / 입점·제휴 문의 페이지 공통 레이아웃 (서버 컴포넌트, 폼은 children으로 주입)
// 좌: 소개 패널 + 문의 폼(세로 스택) / 우: 실시간 문의 현황 보드
export default function PartnershipLayout({ info, panelBg, boardType, children }: {
  info: PartnerInfo;
  panelBg: string;
  boardType?: string;        // "franchise" | "wholesale" — 우측 보드를 해당 유형만 표시
  children: React.ReactNode;
}) {
  return (
    <main>
      <div className="bg-[#F5F2ED] py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* 좌: 소개 패널 + 폼 (세로 스택) */}
            <div className="flex flex-col border border-gray-200 bg-white overflow-hidden">
              <div className="px-8 py-10" style={{ backgroundColor: panelBg }}>
                <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">Partnership</p>
                <h2 className="text-2xl font-bold text-white mb-4">{info.panel_title}</h2>
                <p className="text-gray-300 text-sm leading-relaxed">{info.panel_desc}</p>
                <ul className="mt-7 space-y-3">
                  {info.benefits.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="w-1.5 h-1.5 bg-[#ff550c] rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-7 border-t border-white/15">
                  <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">직통 전화</p>
                  <p className="text-sm font-semibold text-white">{info.phone}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{info.hours}</p>
                </div>
              </div>

              <div className="px-8 py-8">
                <h3 className="text-base font-bold text-[#1A2B4A] mb-6">{info.form_title}</h3>
                {children}
              </div>
            </div>

            {/* 우: 실시간 문의 현황 — 데스크톱은 좌측 칼럼 높이에 맞춰 내부 스크롤, 모바일은 고정 높이 */}
            <div className="relative h-[600px] lg:h-auto">
              <div className="h-full lg:absolute lg:inset-0">
                <InquiryBoard type={boardType} />
              </div>
            </div>
          </div>

          {/* 페이지 간 이동 */}
          <div className="flex items-center justify-center gap-5 text-xs flex-wrap">
            <Link href="/partnership/franchise" className="text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">가맹·창업 문의</Link>
            <Link href="/partnership/wholesale" className="text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">브랜드 입점·제휴 문의</Link>
            <Link href="/products" className="text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">제품 라인업 보기</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
