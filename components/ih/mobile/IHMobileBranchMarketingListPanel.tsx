"use client";
import { useMemo, useState } from "react";
import type { IHBranchMarketingListRow } from "@/lib/ih/collabs";
import { BRANCH_MKT_STATUS_ORDER, BRANCH_MKT_STATUS_LABEL, BRANCH_MKT_STATUS_COLOR, BRANCH_MKT_STATUS_TEXT_COLOR, fmtCostCompact } from "@/lib/ih/influencer-shared";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y.slice(2)}.${m}.${d}`;
}
/** 상태에 따라 날짜 라벨을 다르게 부른다 — 예: 방문예정이면 "방문예정 날짜". */
function statusDateLabel(status: string): string {
  return `${BRANCH_MKT_STATUS_LABEL[status] ?? status} 날짜`;
}

const selectCls = "rounded-md border border-slate-200 px-1.5 py-1 text-[12px] text-slate-700 bg-white flex-1 min-w-0";
const filterLabelCls = "text-[11.5px] text-slate-500 flex-shrink-0 w-9";

/**
 * 목록 항목 탭 시 세부내역 — Mobile Viewer 안에서 상태로만 전환한다. PC 상세 페이지로 실제 이동시키면 그 페이지가
 * Mobile Viewer를 해당 인플루언서 화면으로 재동기화(IHMobileSelectSync)해버려 세부내역 대신 다른 화면으로
 * 튀는 것처럼 보인다(IHMobileSponsorListPanel에서 동일 문제 확인).
 */
function BranchMarketingDetailView({ r, onBack }: { r: IHBranchMarketingListRow; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center px-2 border-b border-slate-100">
        <button type="button" onClick={onBack} className="flex items-center gap-1 px-2 py-1.5 text-[13.5px] text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          목록
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 mb-2 ${BRANCH_MKT_STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-700"}`}>
          {BRANCH_MKT_STATUS_LABEL[r.status] ?? r.status}
        </span>
        <h2 className="text-[17px] font-bold text-slate-900">{r.branchName}</h2>
        <p className="text-[13.5px] text-slate-600 mt-0.5">{r.influencerNickname ?? "미매칭"} · {r.influencerChannel ?? "-"}</p>
        <div className="mt-3 rounded-lg border border-slate-200 divide-y divide-slate-50">
          {[
            ["회차", r.round != null ? `${r.round}회차` : "-"],
            [statusDateLabel(r.status), fmtDate(r.statusDate)],
            ["비용", fmtCostCompact(r.cost)],
            ["콘텐츠 형태", r.contentFormat ?? "-"],
            ["조회수", r.views != null ? r.views.toLocaleString("ko-KR") : "-"],
            ["반응수", r.reactions != null ? r.reactions.toLocaleString("ko-KR") : "-"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 text-[13.5px]">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Viewer의 지점 마케팅 목록 — PC "지점 마케팅" 목록이 이미 조회한 결과를 그대로 재사용한다(별도 DB 조회 없음).
 */
export default function IHMobileBranchMarketingListPanel({ items }: { items: IHBranchMarketingListRow[] }) {
  const [selected, setSelected] = useState<IHBranchMarketingListRow | null>(null);
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState("");

  const filtered = items.filter((r) => {
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      const hit = r.influencerNickname?.toLowerCase().includes(qq) || r.branchName.toLowerCase().includes(qq);
      if (!hit) return false;
    }
    if (status && r.status !== status) return false;
    return true;
  });
  const hasLocalFilters = Boolean(q.trim() || status);
  const resetLocalFilters = () => {
    setQ("");
    setStatus("");
  };

  // 상태(방문예정→방문완료→등록예정→등록완료) 순서로 묶는다 — 제품 협찬 목록과 동일한 방식.
  const groups = useMemo(() => {
    const map = new Map<string, IHBranchMarketingListRow[]>();
    for (const r of filtered) {
      if (!map.has(r.status)) map.set(r.status, []);
      map.get(r.status)!.push(r);
    }
    return BRANCH_MKT_STATUS_ORDER.filter((st) => map.has(st)).map((st) => [st, map.get(st)!] as const);
  }, [filtered]);

  if (selected) {
    return <BranchMarketingDetailView r={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[12px] text-slate-500">Influencer Hub</span>
      </header>

      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2">
        <p className="text-[15px] font-bold text-slate-900">지점 마케팅</p>
        <div className="flex items-center gap-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="지점/인플루언서 검색"
            className="flex-1 min-w-0 rounded-md border border-slate-200 px-3 py-1.5 text-[13.5px] outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex-shrink-0 rounded-md border px-2.5 py-1.5 text-[13px] font-semibold ${
              filtersOpen || hasLocalFilters ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700"
            }`}
          >
            필터
          </button>
        </div>

        {filtersOpen && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>상태</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="">전체</option>
                {BRANCH_MKT_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{BRANCH_MKT_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-slate-500">
            {hasLocalFilters ? `검색 결과 ${filtered.length}건` : `전체 ${items.length.toLocaleString("ko-KR")}건`}
          </p>
          {hasLocalFilters && (
            <button type="button" onClick={resetLocalFilters} className="text-[12px] text-slate-500 hover:text-slate-700">
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[14px] text-slate-500">{hasLocalFilters ? "검색 결과가 없습니다." : "등록된 지점 마케팅이 없습니다."}</p>
          </div>
        ) : (
          groups.map(([st, rows]) => (
            <div key={st}>
              <div className="sticky top-0 bg-slate-50 px-4 py-1.5 border-y border-slate-100 flex items-center gap-1.5">
                <span className={`inline-block rounded-full text-[11.5px] font-medium px-2 py-0.5 ${BRANCH_MKT_STATUS_COLOR[st] ?? "bg-slate-100 text-slate-700"}`}>
                  {BRANCH_MKT_STATUS_LABEL[st] ?? st}
                </span>
                <span className="text-[12px] text-slate-500">{rows.length}건</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="w-full text-left px-4 py-3 active:bg-slate-50"
                    >
                      <p className={`text-[12.5px] font-bold ${BRANCH_MKT_STATUS_TEXT_COLOR[r.status] ?? "text-blue-600"}`}>
                        {statusDateLabel(r.status)} {fmtDate(r.statusDate)}
                      </p>
                      <p className="text-[14px] font-bold text-slate-900 truncate mt-0.5">{r.branchName}</p>
                      <p className="text-[13.5px] text-slate-600 mt-0.5">
                        {r.influencerNickname ?? "미매칭"}{r.round != null && <span className="ml-1 text-slate-500 text-[12px]">{r.round}회차</span>}
                      </p>
                      <p className="text-[12.5px] text-slate-500 mt-0.5">
                        {r.influencerChannel ?? "-"} · {fmtCostCompact(r.cost)} · 조회수 {r.views != null ? r.views.toLocaleString("ko-KR") : "-"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
