"use client";
import { useState } from "react";
import type { IHDashboardData } from "@/lib/ih/dashboard";
import IHScheduleAgenda from "../dashboard/IHScheduleAgenda";
import IHModal from "../influencers/IHModal";

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

const DEFAULT_FROM = toIsoDate(new Date());
const DEFAULT_TO = toIsoDate(addMonths(new Date(), 1));

/**
 * 지점 마케팅 목록 화면 전용 — 화면에 상시 노출하지 않고, 버튼을 눌렀을 때만 1개월 일정을 모달로 띄워 보여준다.
 * 데이터는 대시보드와 동일한 schedule.branchMarketing을 재사용(별도 조회 없음), 기간도 직접 조정 가능.
 */
export default function IHBranchMarketingCalendarSection({
  branchMarketing,
}: {
  branchMarketing: IHDashboardData["schedule"]["branchMarketing"];
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [appliedFrom, setAppliedFrom] = useState(DEFAULT_FROM);
  const [appliedTo, setAppliedTo] = useState(DEFAULT_TO);

  const applyRange = () => {
    if (!from || !to) return;
    setAppliedFrom(from);
    setAppliedTo(to);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex items-center gap-1.5 rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-[13.5px] font-semibold px-3.5 py-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x={3} y={5} width={18} height={16} rx={2} />
          <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
        </svg>
        일정 캘린더 보기
      </button>

      {open && (
        <IHModal title="일정 캘린더" onClose={() => setOpen(false)}>
          <div className="flex items-center gap-1.5 mb-3">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13px]" />
            <span className="text-slate-300">~</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13px]" />
            <button
              type="button"
              onClick={applyRange}
              disabled={!from || !to}
              className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-3 py-1.5 disabled:opacity-50"
            >
              조회
            </button>
          </div>
          <IHScheduleAgenda
            branchMarketing={branchMarketing}
            sponsors={[]}
            startDate={new Date(appliedFrom + "T00:00:00")}
            dayCount={daysBetween(appliedFrom, appliedTo)}
            hideEmptyDays
            bare
          />
        </IHModal>
      )}
    </>
  );
}
