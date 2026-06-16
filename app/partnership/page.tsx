import type { Metadata } from "next";
import Link from "next/link";
import { FranchiseForm, WholesaleForm } from "@/components/PartnershipForms";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "파트너십 — 가맹·제휴 문의 | WORKUP",
  description: "WORKUP 가맹 창업 및 제휴 문의 안내.",
};

export default function PartnershipPage() {
  return (
    <main>
      {/* 히어로 */}
      <div className="bg-[#1A2B4A] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">PARTNERSHIP</p>
              <h1 className="text-4xl font-bold text-white mb-4">WORKUP과 함께</h1>
              <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
                WORKUP 브랜드로 창업하거나, 내 브랜드를 WORKUP 매장에 입점시키고 싶다면
                아래에서 직접 문의해 주세요.
              </p>
            </div>
            <div className="flex-shrink-0 pt-1">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#F5F2ED] py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-14">

          {/* 가맹 창업 문의 */}
          <section id="franchise" className="scroll-mt-20">
            <div className="grid md:grid-cols-2 gap-0 border border-gray-200 bg-white overflow-hidden">
              {/* 좌: 소개 패널 */}
              <div className="bg-[#1A2B4A] px-10 py-12 flex flex-col justify-between">
                <div>
                  <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">Franchise</p>
                  <h2 className="text-2xl font-bold text-white mb-4">가맹 창업 문의</h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    WORKUP 브랜드로 독립 매장을 창업하고 싶으신 분을 위한 안내입니다.
                    현장에서 검증된 제품 라인업과 본사의 운영 지원을 바탕으로 시작하세요.
                  </p>
                  <ul className="mt-8 space-y-3">
                    {[
                      "본사 MD·운영 가이드 제공",
                      "전용 POS·재고 관리 시스템",
                      "오픈 전 현장 교육 1주",
                      "마케팅 소재 무상 지원",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 bg-[#ff550c] rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 pt-8 border-t border-[#243d5e]">
                  <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">직통 전화</p>
                  <p className="text-sm font-semibold text-white">02-0000-0000</p>
                  <p className="text-xs text-gray-500 mt-0.5">평일 09:00 – 18:00</p>
                </div>
              </div>

              {/* 우: 문의 폼 */}
              <div className="px-10 py-12">
                <h3 className="text-base font-bold text-[#1A2B4A] mb-6">가맹 창업 문의하기</h3>
                <FranchiseForm />
              </div>
            </div>
          </section>

          {/* 제휴 문의 */}
          <section id="alliance" className="scroll-mt-20">
            <div className="grid md:grid-cols-2 gap-0 border border-gray-200 bg-white overflow-hidden">
              {/* 좌: 소개 패널 */}
              <div className="bg-[#2d4f72] px-10 py-12 flex flex-col justify-between">
                <div>
                  <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">Partnership</p>
                  <h2 className="text-2xl font-bold text-white mb-4">제휴 문의</h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    의류 브랜드를 운영 중이신가요? 내 브랜드 제품을 WORKUP 매장에 납품하고
                    싶다면 아래 폼을 통해 문의해 주세요. 작업복·캐주얼·안전용품·잡화
                    카테고리의 브랜드를 환영합니다.
                  </p>
                  <ul className="mt-8 space-y-3">
                    {[
                      "전국 WORKUP 매장 입점 기회",
                      "현장 특화 고객층과의 직접 접점",
                      "공동 프로모션·시즌 기획전 참여",
                      "브랜드 전담 입점 매니저 배정",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 bg-[#ff550c] rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 pt-8 border-t border-[#1a3550]">
                  <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">직통 전화</p>
                  <p className="text-sm font-semibold text-white">02-0000-0001</p>
                  <p className="text-xs text-gray-500 mt-0.5">평일 09:00 – 18:00</p>
                </div>
              </div>

              {/* 우: 문의 폼 */}
              <div className="px-10 py-12">
                <h3 className="text-base font-bold text-[#1A2B4A] mb-6">제휴 문의하기</h3>
                <WholesaleForm />
              </div>
            </div>
          </section>

          {/* 하단 */}
          <div className="text-center py-2">
            <Link
              href="/products"
              className="text-xs text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors"
            >
              제품 라인업 먼저 둘러보기 →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
