"use client";
import { useState } from "react";
import type { IHDashboardData } from "@/lib/ih/dashboard";
import IHScheduleAgenda from "./IHScheduleAgenda";
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
 * "2주 일정" 패널 + 옆의 "기간 일정 확인" 버튼. 버튼을 누르면 기간(기본 1개월)을 직접 선택해 같은 데이터를
 * 모달로 넓혀 보여준다(별도 조회 없음 — page.tsx가 이미 가져온 data.schedule을 그대로 재사용).
 */
export default function IHScheduleAgendaSection({
  branchMarketing,
  sponsors,
}: {
  branchMarketing: IHDashboardData["schedule"]["branchMarketing"];
  sponsors: IHDashboardData["schedule"]["sponsors"];
}) {
  const [showRange, setShowRange] = useState(false);
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
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[14.5px] font-bold text-slate-900">2주 일정</h2>
        <button
          type="button"
          onClick={() => setShowRange(true)}
          className="flex-shrink-0 rounded-md border border-slate-200 text-slate-600 hover:border-slate-400 text-[12.5px] font-semibold px-3 py-1.5"
        >
          기간 일정 확인
        </button>
      </div>
      <IHScheduleAgenda branchMarketing={branchMarketing} sponsors={sponsors} bare />

      {showRange && (
        <IHModal title="기간 일정 확인" onClose={() => setShowRange(false)}>
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
            sponsors={sponsors}
            startDate={new Date(appliedFrom + "T00:00:00")}
            dayCount={daysBetween(appliedFrom, appliedTo)}
            hideEmptyDays
            bare
          />
        </IHModal>
      )}
    </div>
  );
}
