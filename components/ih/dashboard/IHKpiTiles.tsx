import type { IHDashboardData } from "@/lib/ih/dashboard";
import { fmtNumber, fmtWon } from "./format";

// KPI는 Dashboard의 보조 요약이다 — 아래 "이번 주 확인해야 할 협찬" 등 Action 영역이
// 시각적 우선순위를 갖도록, 타일은 조금 더 조밀하고 절제된 톤으로 유지한다.
export default function IHKpiTiles({ overview }: { overview: IHDashboardData["overview"] }) {
  const tiles: { label: string; value: string }[] = [
    { label: "전체 인플루언서", value: fmtNumber(overview.totalInfluencers) },
    { label: "활동 중", value: fmtNumber(overview.activeInfluencers) },
    { label: "진행 중 협찬", value: fmtNumber(overview.inProgressSponsors) },
    { label: "업로드 예정", value: fmtNumber(overview.uploadScheduledCount) },
    { label: "이번 달 마케팅", value: `${fmtNumber(overview.thisMonthMarketingCount)}건` },
    { label: "이번 달 집행 비용", value: fmtWon(overview.thisMonthMarketingCost) },
  ];

  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 mb-2 tracking-[0.06em]">전체 현황</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11px] text-slate-400">{t.label}</p>
            <p className="mt-0.5 text-[16px] font-bold text-slate-900 tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
