import Link from "next/link";
import type { PartnerInfo } from "@/data/partnership";
import PartnershipPanel from "./PartnershipPanel";
import InquiryBoard from "./InquiryBoard";

// 가맹·창업 / 입점·제휴 문의 페이지 공통 레이아웃 (서버 컴포넌트, 폼은 children으로 주입)
// 좌: 소개 패널 + 문의 폼(세로 스택) / 우: 실시간 문의 현황 보드
// 패널 배경색·글자 크기·색상은 info(관리자 편집값)로 제어한다.
export default function PartnershipLayout({ info, boardType, guideButton, children }: {
  info: PartnerInfo;
  boardType?: string;             // "franchise" | "wholesale" — 우측 보드를 해당 유형만 표시
  guideButton?: React.ReactNode;  // 있으면 패널 아래 노출(예: 창업안내 모달 버튼)
  children: React.ReactNode;
}) {
  const st = info.styles;
  return (
    <main>
      <div className="bg-[#FAFAF8] py-8">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* 좌: 소개 패널 + 폼 (세로 스택) */}
            <div className="flex flex-col border border-gray-200 bg-white overflow-hidden">
              <PartnershipPanel info={info} />

              {guideButton}

              <div className="px-8 py-8">
                <h3 className="font-bold" style={{ fontSize: st.form_title.size, color: st.form_title.color }}>
                  {info.form_title}
                </h3>
                {info.form_desc ? (
                  <p className="mt-1.5 mb-6" style={{ fontSize: st.form_desc.size, color: st.form_desc.color }}>
                    {info.form_desc}
                  </p>
                ) : (
                  <div className="mb-6" />
                )}
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
            <Link href="/partnership/franchise" className="text-[#303236] underline hover:text-[#ff550c] transition-colors">가맹·창업 문의</Link>
            <Link href="/partnership/wholesale" className="text-[#303236] underline hover:text-[#ff550c] transition-colors">브랜드 입점·제휴 문의</Link>
            <Link href="/products" className="text-[#303236] underline hover:text-[#ff550c] transition-colors">제품 라인업 보기</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
