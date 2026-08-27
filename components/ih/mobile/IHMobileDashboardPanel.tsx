"use client";
import { useState } from "react";
import Link from "next/link";
import type { IHDashboardData, IHIntegratedDashboardData, IHDashboardTypeStat, IHDashboardPeriod } from "@/lib/ih/dashboard";
import { DASHBOARD_TYPE_COST_CRITERIA } from "@/lib/ih/dashboard";
import { fmtCostCompact } from "@/lib/ih/influencer-shared";
import IHScheduleAgenda from "../dashboard/IHScheduleAgenda";

function fmtNumber(n: number | null | undefined) {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}
function fmtWonThousands(n: number | null | undefined): string {
  if (n == null) return "0천원";
  return `${Math.round(n / 1000).toLocaleString("ko-KR")}천원`;
}
function fmtWon(n: number | null | undefined) {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addMonths(d: Date, months: number): Date {
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
}
function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + "T00:00:00");
  const to = new Date(toIso + "T00:00:00");
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
}

const PERIOD_OPTIONS: { value: IHDashboardPeriod; label: string }[] = [
  { value: "this_month", label: "이번 달" },
  { value: "last_month", label: "지난 달" },
  { value: "last_3_months", label: "최근 3개월" },
  { value: "custom", label: "직접 선택" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pt-3 pb-1.5 text-[12.5px] font-bold text-slate-500">{children}</p>;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 px-2 py-2 min-w-0">
      <p className="text-[10.5px] text-slate-500 whitespace-normal break-keep leading-snug">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold text-slate-900 tabular-nums whitespace-normal break-words">{value}</p>
    </div>
  );
}

/** 토글 버튼 — 성과 요약/유형별 현황 펼쳐보기 공용. 가로 폭을 꽉 채우고 색으로 구분한다. */
function ToggleButton({ label, active, color, onClick }: { label: string; active: boolean; color: "blue" | "violet"; onClick: () => void }) {
  const activeCls = color === "blue" ? "bg-blue-600 text-white" : "bg-violet-600 text-white";
  const inactiveCls = color === "blue" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2.5 py-2 text-[12.5px] font-semibold transition-colors ${active ? activeCls : inactiveCls}`}
    >
      {label}
      <svg className={`w-3 h-3 transition-transform ${active ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function ByTypeCard({ title, href, criteria, stat }: { title: string; href: string; criteria: string; stat: IHDashboardTypeStat }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <Link href={href} className="text-[13.5px] font-bold text-slate-900 hover:underline">
          {title}
        </Link>
        <span className="text-[11.5px] text-slate-500">{fmtNumber(stat.count)}건</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[12.5px]">
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
      <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">{criteria}</p>
    </div>
  );
}

const DEFAULT_FROM = toIsoDate(new Date());
const DEFAULT_TO = toIsoDate(addMonths(new Date(), 1));

/** Mobile Viewer의 Dashboard 요약 — PC Dashboard가 이미 조회한 데이터를 그대로 재사용한다(별도 DB 조회 없음).
 *  단, 기간 필터는 모바일 화면 자체가 독립적으로 갖는다(PC 패널과 별개로 모바일에서 바로 조작 가능해야 해서) —
 *  그래서 성과 요약/유형별 현황/전체 현황 숫자는 PC의 현재 선택과 다를 수 있다(모바일에서 고른 기간 기준). */
export default function IHMobileDashboardPanel({ data, integrated }: { data: IHDashboardData; integrated?: IHIntegratedDashboardData | null }) {
  const [period, setPeriod] = useState<IHDashboardPeriod>(integrated?.period ?? "this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [mobileIntegrated, setMobileIntegrated] = useState<IHIntegratedDashboardData | null | undefined>(integrated);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  const [showPerf, setShowPerf] = useState(false);
  const [showByType, setShowByType] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [rangeApplied, setRangeApplied] = useState(false);
  const [rangeFrom, setRangeFrom] = useState(DEFAULT_FROM);
  const [rangeTo, setRangeTo] = useState(DEFAULT_TO);
  const [appliedRangeFrom, setAppliedRangeFrom] = useState(DEFAULT_FROM);
  const [appliedRangeTo, setAppliedRangeTo] = useState(DEFAULT_TO);

  const fetchPeriod = async (p: IHDashboardPeriod, from?: string, to?: string) => {
    if (p === "custom" && (!from || !to)) return;
    setLoadingPeriod(true);
    try {
      const sp = new URLSearchParams({ period: p });
      if (p === "custom" && from && to) {
        sp.set("from", from);
        sp.set("to", to);
      }
      const res = await fetch(`/api/admin/ih/dashboard?${sp.toString()}`);
      if (!res.ok) return;
      const next: IHIntegratedDashboardData = await res.json();
      setMobileIntegrated(next);
    } finally {
      setLoadingPeriod(false);
    }
  };

  const handlePeriodClick = (p: IHDashboardPeriod) => {
    setPeriod(p);
    if (p !== "custom") fetchPeriod(p);
  };

  const integratedNow = mobileIntegrated;

  return (
    <div className="relative flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[12px] text-slate-500">Dashboard</span>
      </header>

      <div className="flex-1 overflow-y-auto pb-3">
        {integratedNow && (
          <>
            {(() => {
              // 진행 이력이 아예 없는(0건) 항목은 숨긴다.
              const overviewTiles = [
                { label: "협찬", count: integratedNow.overview.sponsorsCount, value: `${fmtNumber(integratedNow.overview.sponsorsCount)}건` },
                { label: "방문", count: integratedNow.overview.branchMarketingCount, value: `${fmtNumber(integratedNow.overview.branchMarketingCount)}건` },
                { label: "브랜디드/PPL", count: integratedNow.overview.brandedPplCount, value: `${fmtNumber(integratedNow.overview.brandedPplCount)}건` },
              ].filter((t) => t.count > 0);
              if (overviewTiles.length === 0) return null;
              return (
                <>
                  <SectionTitle>전체 현황</SectionTitle>
                  {/* 숨겨진 항목만큼 컬럼 수도 줄여서, 남은 항목들이 가로 여백 없이 폭을 꽉 채우게 한다. */}
                  <div className="grid gap-2 px-4 pb-3" style={{ gridTemplateColumns: `repeat(${overviewTiles.length}, minmax(0, 1fr))` }}>
                    {overviewTiles.map((t) => (
                      <Tile key={t.label} label={t.label} value={t.value} />
                    ))}
                  </div>
                </>
              );
            })()}

            {/* 기간 선택 — PC와 별개로 모바일 화면 자체에서 조작. 한 줄에 다 들어가도록 폭에 맞춰 균등 배분한다. */}
            <div className="flex items-center gap-1 px-4 pb-3">
              {PERIOD_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handlePeriodClick(o.value)}
                  className={`flex-1 min-w-0 rounded-md px-1 py-1 text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                    period === o.value ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {loadingPeriod && <p className="px-4 -mt-2 pb-3 text-[11px] text-slate-400">불러오는 중…</p>}
            {period === "custom" && (
              <div className="flex items-center gap-1.5 px-4 pb-3">
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] flex-1 min-w-0" />
                <span className="text-slate-300">~</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-[12px] flex-1 min-w-0" />
                <button
                  type="button"
                  onClick={() => fetchPeriod("custom", customFrom, customTo)}
                  disabled={!customFrom || !customTo}
                  className="flex-shrink-0 rounded-md bg-slate-900 text-white text-[12px] font-semibold px-2.5 py-1 disabled:opacity-50"
                >
                  조회
                </button>
              </div>
            )}

            {/* 성과 요약 / 유형별 현황 — 버튼 2개로 펼쳐보기, 가로 꽉 채움 + 컬러 구분 */}
            <div className="flex items-center gap-1.5 px-4 pb-2">
              <ToggleButton label="성과 요약" color="blue" active={showPerf} onClick={() => setShowPerf((v) => !v)} />
              <ToggleButton label="유형별 현황" color="violet" active={showByType} onClick={() => setShowByType((v) => !v)} />
            </div>

            {showPerf && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <Tile label="총 비용" value={fmtWonThousands(integratedNow.performanceSummary.totalCost)} />
                  <Tile label="총 조회수" value={fmtNumber(integratedNow.performanceSummary.totalViews)} />
                  <Tile label="총 좋아요" value={fmtNumber(integratedNow.performanceSummary.totalLikes)} />
                  <Tile label="총 댓글" value={fmtNumber(integratedNow.performanceSummary.totalComments)} />
                  <Tile label="평균 조회수" value={integratedNow.performanceSummary.avgViews != null ? fmtNumber(integratedNow.performanceSummary.avgViews) : "데이터 없음"} />
                  <Tile label="조회당 비용" value={integratedNow.performanceSummary.cpv != null ? fmtCostCompact(integratedNow.performanceSummary.cpv) : "-"} />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 leading-snug">브랜디드/PPL은 콘텐츠 성과 개념이 없는 단가 견적이라 이 집계에서 제외됩니다.</p>
              </div>
            )}

            {showByType && (
              <div className="px-4 pb-3 space-y-2">
                {integratedNow.byType.sponsors.count > 0 && (
                  <ByTypeCard title="제품 협찬" href="/admin/influencer-hub/sponsors" criteria={DASHBOARD_TYPE_COST_CRITERIA.sponsors} stat={integratedNow.byType.sponsors} />
                )}
                {integratedNow.byType.branchMarketing.count > 0 && (
                  <ByTypeCard title="지점 마케팅" href="/admin/influencer-hub/branch-marketing" criteria={DASHBOARD_TYPE_COST_CRITERIA.branchMarketing} stat={integratedNow.byType.branchMarketing} />
                )}
                {integratedNow.byType.brandedPpl.count > 0 && (
                  <ByTypeCard title="브랜디드/PPL" href="/admin/influencer-hub/branded-ppl" criteria={DASHBOARD_TYPE_COST_CRITERIA.brandedPpl} stat={integratedNow.byType.brandedPpl} />
                )}
                {integratedNow.byType.sponsors.count === 0 && integratedNow.byType.branchMarketing.count === 0 && integratedNow.byType.brandedPpl.count === 0 && (
                  <p className="text-[12.5px] text-slate-400 text-center py-4">선택한 기간에 해당하는 건이 없습니다.</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="border-t border-slate-100">
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <p className="text-[12.5px] font-bold text-slate-500">{rangeApplied ? "기간 일정 확인" : "2주 일정"}</p>
            <div className="flex items-center gap-1">
              {rangeApplied && (
                <button
                  type="button"
                  onClick={() => setRangeApplied(false)}
                  className="rounded-md border border-slate-200 text-slate-500 text-[11px] font-semibold px-2 py-1"
                >
                  2주 일정으로
                </button>
              )}
              <button
                type="button"
                onClick={() => setRangeModalOpen(true)}
                className="rounded-md border border-slate-200 text-slate-600 text-[11px] font-semibold px-2 py-1"
              >
                기간 일정 확인
              </button>
            </div>
          </div>

          {rangeApplied ? (
            <IHScheduleAgenda
              branchMarketing={data.schedule.branchMarketing}
              sponsors={data.schedule.sponsors}
              startDate={new Date(appliedRangeFrom + "T00:00:00")}
              dayCount={daysBetween(appliedRangeFrom, appliedRangeTo)}
              hideEmptyDays
              bare
              scroll={false}
            />
          ) : (
            <IHScheduleAgenda branchMarketing={data.schedule.branchMarketing} sponsors={data.schedule.sponsors} bare scroll={false} />
          )}
        </div>
      </div>

      {/* 기간 선택 팝업 — PC의 IHModal(fixed inset-0)은 폰 프레임 밖으로 튀어나가 여기선 못 쓴다.
          대신 이 패널 자체(위에서 relative)를 기준으로 absolute 오버레이를 띄워, 폰 화면 안에서만 뜨는 팝업처럼 보이게 한다. */}
      {rangeModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-end" onClick={() => setRangeModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full bg-white rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <p className="text-[14px] font-bold text-slate-900 mb-3">기간 일정 확인</p>
            <div className="flex items-center gap-1.5 mb-3">
              <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13px] flex-1 min-w-0" />
              <span className="text-slate-300">~</span>
              <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13px] flex-1 min-w-0" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRangeModalOpen(false)}
                className="flex-1 rounded-md border border-slate-200 text-slate-600 text-[13.5px] font-semibold px-3 py-2"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppliedRangeFrom(rangeFrom);
                  setAppliedRangeTo(rangeTo);
                  setRangeApplied(true);
                  setRangeModalOpen(false);
                }}
                disabled={!rangeFrom || !rangeTo}
                className="flex-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-3 py-2 disabled:opacity-50"
              >
                조회
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
