import type { IHDashboardData } from "@/lib/ih/dashboard";
import { fmtNumber, fmtWon, SPONSOR_STAGE_LABEL } from "./format";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-[13.5px] font-bold text-slate-900">{title}</h2>
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

/** 4. 인플루언서 현황 breakdown */
export function IHInfluencerBreakdownPanel({ breakdown }: { breakdown: IHDashboardData["influencerBreakdown"] }) {
  return (
    <Panel title="인플루언서 현황">
      <StatRow label="전체" value={fmtNumber(breakdown.all)} />
      <StatRow label="제품 협찬자" value={fmtNumber(breakdown.productSponsors)} />
      <StatRow label="지점 Pool" value={fmtNumber(breakdown.branchPool)} />
      <StatRow label="PPL 채널" value={fmtNumber(breakdown.brandedPpl)} />
    </Panel>
  );
}

/** 제품 협찬 단계별 현황 */
export function IHSponsorStatusPanel({ breakdown }: { breakdown: IHDashboardData["sponsorStatusBreakdown"] }) {
  const stages: (keyof typeof breakdown)[] = [
    "PLANNED",
    "SENT",
    "RECEIVED",
    "PRODUCING",
    "UPLOAD_SCHEDULED",
    "UPLOADED",
  ];
  return (
    <Panel title="제품 협찬 현황">
      {stages.map((s) => (
        <StatRow key={s} label={SPONSOR_STAGE_LABEL[s]} value={fmtNumber(breakdown[s])} />
      ))}
    </Panel>
  );
}

/** 지점별 집행 건수/비용 상위 */
export function IHBranchTotalsPanel({ branchTotals }: { branchTotals: IHDashboardData["branchTotals"] }) {
  return (
    <Panel title="지점별 집행 (상위)">
      {branchTotals.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-slate-400">등록된 지점 마케팅이 없습니다</p>
      ) : (
        branchTotals.map((b) => (
          <div key={b.branchId} className="flex items-center justify-between py-1.5 text-[13px]">
            <span className="text-slate-600 truncate">{b.branchName}</span>
            <span className="flex-shrink-0 text-slate-800 tabular-nums">
              {b.count}건 · {fmtWon(b.cost)}
            </span>
          </div>
        ))
      )}
    </Panel>
  );
}

/** 5. 성과 */
export function IHPerformancePanel({ performance }: { performance: IHDashboardData["performance"] }) {
  return (
    <Panel title="성과">
      <StatRow label="조회수" value={fmtNumber(performance.totalViews)} />
      <StatRow label="반응수" value={fmtNumber(performance.totalReactions)} />
      <StatRow label="평균 조회수" value={performance.avgViews != null ? fmtNumber(performance.avgViews) : "데이터 없음"} />
      <StatRow label="CPV" value={performance.cpv != null ? `${fmtNumber(performance.cpv)}원` : "-"} />
      <StatRow label="CPE" value={performance.cpe != null ? `${fmtNumber(performance.cpe)}원` : "-"} />
    </Panel>
  );
}
