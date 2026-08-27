"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { IHDashboardPeriod, IHIntegratedDashboardData, IHDashboardTypeStat } from "@/lib/ih/dashboard";
import { DASHBOARD_TYPE_COST_CRITERIA } from "@/lib/ih/dashboard";
import { fmtNumber, fmtWon } from "./format";
import { useIHMobileSelection } from "../IHMobileSelectionContext";
import IHModal from "../influencers/IHModal";

/** 성과 요약의 "총 비용"은 값이 커서 천원 단위로 줄여 보여준다(예: 1,888,000 → "1,888천원"). */
function fmtWonThousands(n: number | null | undefined): string {
  if (n == null) return "0천원";
  return `${Math.round(n / 1000).toLocaleString("ko-KR")}천원`;
}

const PERIOD_OPTIONS: { value: IHDashboardPeriod; label: string }[] = [
  { value: "this_month", label: "이번 달" },
  { value: "last_month", label: "지난 달" },
  { value: "last_3_months", label: "최근 3개월" },
  { value: "custom", label: "직접 선택" },
];

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[14.5px] font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-[16px] font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

/** "?" 아이콘 — 클릭하면 집계 기준 설명을 토글로 보여준다(PC/Mobile 공용, hover가 아니라 클릭인 이유: 모바일에서도 써야 해서). */
export function IHInfoTooltip({ text }: { text: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="집계 기준 안내"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-300 text-slate-500 text-[10px] font-bold hover:border-slate-500 hover:text-slate-700"
      >
        ?
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 right-0 top-6 w-64 rounded-lg border border-slate-200 bg-white shadow-lg p-3 space-y-1.5">
            <p className="text-[11.5px] font-bold text-slate-700 mb-1">집계 기준</p>
            {text.map((t) => (
              <p key={t} className="text-[11.5px] text-slate-500 leading-snug">{t}</p>
            ))}
          </div>
        </>
      )}
    </span>
  );
}

function TypeStatCard({ title, href, statusLabel, stat }: { title: string; href: string; statusLabel?: string; stat: IHDashboardTypeStat }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3.5">
      <div className="flex items-center justify-between mb-2">
        <Link href={href} className="text-[14px] font-bold text-slate-900 hover:underline">
          {title}
        </Link>
        <span className="text-[12px] text-slate-500">{fmtNumber(stat.count)}건</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <div>
          <p className="text-slate-500">비용</p>
          <p className="font-semibold text-slate-800 tabular-nums">{fmtWon(stat.cost)}</p>
        </div>
        <div>
          <p className="text-slate-500">조회수</p>
          <p className="font-semibold text-slate-800 tabular-nums">{stat.views != null ? fmtNumber(stat.views) : "해당 없음"}</p>
        </div>
        <div>
          <p className="text-slate-500">좋아요</p>
          <p className="font-semibold text-slate-800 tabular-nums">{stat.likes != null ? fmtNumber(stat.likes) : "해당 없음"}</p>
        </div>
        <div>
          <p className="text-slate-500">댓글</p>
          <p className="font-semibold text-slate-800 tabular-nums">{stat.comments != null ? fmtNumber(stat.comments) : "해당 없음"}</p>
        </div>
      </div>
      {statusLabel && <p className="mt-2 text-[11.5px] text-slate-400">{statusLabel}</p>}
    </div>
  );
}

/**
 * Phase 9 통합 대시보드 — 기존 "확인해야 할 마케팅"/"진행 중 마케팅" 액션 리스트(page.tsx의 아래쪽)는 그대로 두고,
 * 전체 현황/성과 요약/기간별 유형별 현황/최근 활동을 별도 섹션으로 추가한다.
 * 기간 필터를 바꾸면 이 컴포넌트가 /api/admin/ih/dashboard를 다시 호출하고, 그 결과를 Mobile Viewer에도 그대로
 * 반영한다(Context 공유 — 별도 조회 없음).
 */
export default function IHIntegratedDashboard({ initialData }: { initialData: IHIntegratedDashboardData }) {
  const { setIntegratedDashboardData } = useIHMobileSelection();
  const [period, setPeriod] = useState<IHDashboardPeriod>(initialData.period);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<IHIntegratedDashboardData>(initialData);
  const [loading, setLoading] = useState(false);
  const [showByType, setShowByType] = useState(false);

  const fetchData = async (p: IHDashboardPeriod, from?: string, to?: string) => {
    if (p === "custom" && (!from || !to)) return; // 직접 선택은 두 날짜가 다 있어야 조회한다.
    setLoading(true);
    try {
      const sp = new URLSearchParams({ period: p });
      if (p === "custom" && from && to) {
        sp.set("from", from);
        sp.set("to", to);
      }
      const res = await fetch(`/api/admin/ih/dashboard?${sp.toString()}`);
      if (!res.ok) return;
      const next: IHIntegratedDashboardData = await res.json();
      setData(next);
    } finally {
      setLoading(false);
    }
  };

  // Mobile Viewer가 PC와 동일한 데이터를 쓰도록 항상 최신 데이터를 반영한다.
  useEffect(() => {
    setIntegratedDashboardData(data);
    return () => setIntegratedDashboardData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handlePeriodClick = (p: IHDashboardPeriod) => {
    setPeriod(p);
    if (p !== "custom") fetchData(p);
  };

  const { overview, performanceSummary, byType } = data;

  return (
    <div className="space-y-4">
      {/* 1. 전체 현황 — 항상 현재 기준 누적 수치(기간 필터 영향 없음). 진행 이력이 아예 없는(0건) 항목은 숨긴다. */}
      {(() => {
        const overviewTiles = [
          { label: "전체 인플루언서", count: overview.totalInfluencers, value: `${fmtNumber(overview.totalInfluencers)}명` },
          { label: "활동 중", count: overview.activeInfluencers, value: `${fmtNumber(overview.activeInfluencers)}명` },
          { label: "진행 중 협업", count: overview.inProgressCollabs, value: `${fmtNumber(overview.inProgressCollabs)}건` },
          { label: "제품 협찬", count: overview.sponsorsCount, value: `${fmtNumber(overview.sponsorsCount)}건` },
          { label: "지점 마케팅", count: overview.branchMarketingCount, value: `${fmtNumber(overview.branchMarketingCount)}건` },
          { label: "브랜디드/PPL", count: overview.brandedPplCount, value: `${fmtNumber(overview.brandedPplCount)}건` },
        ].filter((t) => t.count > 0);
        if (overviewTiles.length === 0) return null;
        return (
          <div>
            <p className="text-[12px] font-semibold text-slate-500 mb-2 tracking-[0.06em]">전체 현황</p>
            {/* 항목 수가 줄어도(0건 숨김) 남은 타일이 가로 폭을 꽉 채우도록 auto-fit — 화면이 좁아지면 자연스럽게 줄바꿈된다. */}
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              {overviewTiles.map((t) => (
                <Tile key={t.label} label={t.label} value={t.value} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* 기간 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => handlePeriodClick(o.value)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              period === o.value ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
          >
            {o.label}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-1.5">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13px]" />
            <span className="text-slate-300">~</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13px]" />
            <button
              type="button"
              onClick={() => fetchData("custom", customFrom, customTo)}
              disabled={!customFrom || !customTo}
              className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-3 py-1.5 disabled:opacity-50"
            >
              조회
            </button>
          </div>
        )}
        {loading && <span className="text-[12.5px] text-slate-400">불러오는 중…</span>}
      </div>

      {/* 2. 성과 요약 — 선택된 기간 기준(제품 협찬 + 지점 마케팅). 유형별 현황은 모달로 뺐다(오른쪽 버튼). */}
      <Section
        title="성과 요약"
        action={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowByType(true)}
              className="rounded-md bg-violet-50 hover:bg-violet-100 text-violet-700 text-[12.5px] font-semibold px-3 py-1.5"
            >
              유형별 현황 보기
            </button>
            <IHInfoTooltip
              text={[DASHBOARD_TYPE_COST_CRITERIA.sponsors, DASHBOARD_TYPE_COST_CRITERIA.branchMarketing, DASHBOARD_TYPE_COST_CRITERIA.brandedPpl]}
            />
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Tile label="총 비용" value={fmtWonThousands(performanceSummary.totalCost)} />
          <Tile label="총 조회수" value={fmtNumber(performanceSummary.totalViews)} />
          <Tile label="총 좋아요" value={fmtNumber(performanceSummary.totalLikes)} />
          <Tile label="총 댓글" value={fmtNumber(performanceSummary.totalComments)} />
          <Tile label="평균 조회수" value={performanceSummary.avgViews != null ? fmtNumber(performanceSummary.avgViews) : "데이터 없음"} />
          <Tile label="조회당 비용" value={performanceSummary.cpv != null ? fmtWon(performanceSummary.cpv) : "-"} />
          <Tile label="반응당 비용" value={performanceSummary.cpe != null ? fmtWon(performanceSummary.cpe) : "-"} />
        </div>
        <p className="mt-2 text-[12px] text-slate-400">브랜디드/PPL은 콘텐츠 성과 개념이 없는 단가 견적이라 이 집계에서 제외됩니다.</p>
      </Section>

      {showByType && (
        <IHModal title="유형별 현황" onClose={() => setShowByType(false)}>
          <div className="grid grid-cols-1 gap-3">
            {byType.sponsors.count > 0 && (
              <TypeStatCard title="제품 협찬" href="/admin/influencer-hub/sponsors" statusLabel={DASHBOARD_TYPE_COST_CRITERIA.sponsors} stat={byType.sponsors} />
            )}
            {byType.branchMarketing.count > 0 && (
              <TypeStatCard title="지점 마케팅" href="/admin/influencer-hub/branch-marketing" statusLabel={DASHBOARD_TYPE_COST_CRITERIA.branchMarketing} stat={byType.branchMarketing} />
            )}
            {byType.brandedPpl.count > 0 && (
              <TypeStatCard title="브랜디드/PPL" href="/admin/influencer-hub/branded-ppl" statusLabel={DASHBOARD_TYPE_COST_CRITERIA.brandedPpl} stat={byType.brandedPpl} />
            )}
            {byType.sponsors.count === 0 && byType.branchMarketing.count === 0 && byType.brandedPpl.count === 0 && (
              <p className="text-[13.5px] text-slate-400 text-center py-6">선택한 기간에 해당하는 건이 없습니다.</p>
            )}
          </div>
        </IHModal>
      )}
    </div>
  );
}
