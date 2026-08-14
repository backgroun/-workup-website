"use client";
import { useState } from "react";
import Link from "next/link";
import IHMobileInfluencerView from "./mobile/IHMobileInfluencerView";
import IHMobileInfluencerListPanel from "./mobile/IHMobileInfluencerListPanel";
import { useIHMobileSelection } from "./IHMobileSelectionContext";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";

const FRAME_W = 320;
const FRAME_H = 640;

/**
 * 스마트폰 프레임 안의 콘텐츠 — Mobile Viewer는 "인플루언서 목록 + 상세" 구조다(Dashboard 요약 화면 없음).
 * 1) 인플루언서를 선택 중이면(PC 상세) → 그 인플루언서 상세 화면
 * 2) 선택된 게 없으면 → 인플루언서 목록을 기본 화면으로 표시.
 *    PC 인플루언서 목록 페이지가 열려있으면 그 페이지가 이미 조회한(필터링된) 결과를 Context로 그대로 재사용하고,
 *    그렇지 않으면(다른 PC 페이지를 보고 있을 때) IHShell이 내려준 기본 목록을 대신 보여준다 — 어느 경우든
 *    Mobile이 별도로 DB를 다시 조회하지 않는다.
 */
function PhoneFrame({ defaultItems, defaultTotal }: { defaultItems: IHInfluencerListItem[]; defaultTotal: number }) {
  const { selectedInfluencer, listItems, listMeta } = useIHMobileSelection();
  const items = listItems ?? defaultItems;
  const meta = listMeta ?? { total: defaultTotal, hasActiveFilters: false };

  return (
    <div className="relative bg-slate-900 rounded-[2.2rem] p-2 shadow-lg" style={{ width: FRAME_W, height: FRAME_H }}>
      <div className="w-full h-full bg-white rounded-[1.6rem] overflow-hidden">
        {selectedInfluencer ? <IHMobileInfluencerView summary={selectedInfluencer} /> : <IHMobileInfluencerListPanel items={items} meta={meta} />}
      </div>
    </div>
  );
}

/**
 * PC 관리자 화면 우측의 Mobile Viewer 패널.
 * 단순 디자인 미리보기가 아니라, 실제 모바일 페이지와 동일한 컴포넌트 + 동일한 조회 결과를 그대로 쓰는 영역이다.
 * 좁은 화면(xl 미만)에서는 기본적으로 숨기고 토글 버튼으로 열람한다.
 */
export default function IHMobilePreview({ defaultItems, defaultTotal }: { defaultItems: IHInfluencerListItem[]; defaultTotal: number }) {
  const [openOnNarrow, setOpenOnNarrow] = useState(false);

  return (
    <>
      {/* 데스크톱(xl↑): 항상 표시되는 고정 패널 */}
      <aside className="hidden xl:flex w-[380px] flex-shrink-0 bg-[#f8fafc] border-l border-slate-200 flex-col items-center py-8">
        <p className="text-[11px] font-semibold text-slate-400 mb-4 tracking-[0.14em]">MOBILE VIEWER</p>
        <PhoneFrame defaultItems={defaultItems} defaultTotal={defaultTotal} />
        <Link
          href="/admin/influencer-hub/mobile"
          target="_blank"
          className="mt-5 text-[12px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          실제 모바일 페이지 열기
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </aside>

      {/* 좁은 화면(xl 미만): 토글 버튼 + 오버레이 패널 */}
      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setOpenOnNarrow(true)}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center"
          title="Mobile Viewer 열기"
          aria-label="Mobile Viewer 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path strokeLinecap="round" d="M11 18h2" />
          </svg>
        </button>

        {openOnNarrow && (
          <div
            className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center"
            onClick={() => setOpenOnNarrow(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
              <p className="text-[11px] font-semibold text-white/60 mb-3 tracking-[0.14em]">MOBILE VIEWER</p>
              <PhoneFrame defaultItems={defaultItems} defaultTotal={defaultTotal} />
              <button
                type="button"
                onClick={() => setOpenOnNarrow(false)}
                className="mt-4 text-[13px] text-white/80 hover:text-white"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
