"use client";
import { useState } from "react";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";
import type { IHSponsorListRow, IHBranchMarketingListRow, IHBrandedPplListRow } from "@/lib/ih/collabs";
import type { IHDashboardData, IHIntegratedDashboardData } from "@/lib/ih/dashboard";
import IHMobileInfluencerListPanel from "./IHMobileInfluencerListPanel";
import IHMobileSponsorListPanel from "./IHMobileSponsorListPanel";
import IHMobileBranchMarketingListPanel from "./IHMobileBranchMarketingListPanel";
import IHMobileBrandedPplListPanel from "./IHMobileBrandedPplListPanel";
import IHMobileDashboardPanel from "./IHMobileDashboardPanel";

type Tab = "dashboard" | "influencers" | "sponsors" | "branch" | "ppl";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "대시보드", icon: "M4 6h16M4 12h16M4 18h7" },
  { key: "influencers", label: "인플루언서", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "sponsors", label: "제품협찬", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { key: "branch", label: "지점", icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "ppl", label: "PPL", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
];

/**
 * 로그인 없이(토큰으로만) 여는 실제 모바일 페이지의 본체 — PC Mobile Viewer의 PhoneFrame과 동일한 패널들을
 * 그대로 재사용하되, PC 세션(Context)에 기대지 않고 서버에서 한 번에 받아온 데이터를 탭으로 전환해 보여준다.
 */
export default function IHMobileStandaloneApp({
  influencers,
  influencersTotal,
  sponsors,
  branchMarketing,
  brandedPpl,
  dashboardData,
  integratedDashboardData,
}: {
  influencers: IHInfluencerListItem[];
  influencersTotal: number;
  sponsors: IHSponsorListRow[];
  branchMarketing: IHBranchMarketingListRow[];
  brandedPpl: IHBrandedPplListRow[];
  dashboardData: IHDashboardData;
  integratedDashboardData: IHIntegratedDashboardData;
}) {
  const [tab, setTab] = useState<Tab>("dashboard");

  let content: React.ReactNode;
  if (tab === "dashboard") {
    content = <IHMobileDashboardPanel data={dashboardData} integrated={integratedDashboardData} />;
  } else if (tab === "influencers") {
    content = <IHMobileInfluencerListPanel items={influencers} meta={{ total: influencersTotal, hasActiveFilters: false }} />;
  } else if (tab === "sponsors") {
    content = <IHMobileSponsorListPanel items={sponsors} />;
  } else if (tab === "branch") {
    content = <IHMobileBranchMarketingListPanel items={branchMarketing} />;
  } else {
    content = <IHMobileBrandedPplListPanel items={brandedPpl} />;
  }

  return (
    <div className="flex flex-col h-dvh bg-white text-slate-900">
      <div className="flex-1 min-h-0">{content}</div>
      <nav className="flex-shrink-0 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10.5px] font-semibold ${
              tab === t.key ? "text-slate-900" : "text-slate-400"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
