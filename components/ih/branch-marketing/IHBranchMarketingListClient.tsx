"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IHBranchMarketingListRow, IHBranchOption } from "@/lib/ih/collabs";
import { summarizeBranchPerformance } from "@/lib/ih/collabs";
import { BRANCH_MKT_STATUS_ORDER, BRANCH_MKT_STATUS_LABEL, BRANCH_MKT_STATUS_COLOR, fmtCostCompact } from "@/lib/ih/influencer-shared";
import { useIHMobileSelection } from "../IHMobileSelectionContext";

const PAGE_SIZE = 20;
const selectCls = "rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px] text-slate-700 bg-white";

type Filters = {
  branchId: string;
  influencerQ: string;
  status: string;
  contentFormat: string;
  dateFrom: string;
  dateTo: string;
};
const DEFAULT_FILTERS: Filters = { branchId: "", influencerQ: "", status: "", contentFormat: "", dateFrom: "", dateTo: "" };

// "상태 날짜" 컬럼 전용 — 연도 없이 월.일만 표기.
function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}.${d}`;
}

export default function IHBranchMarketingListClient() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IHBranchMarketingListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<IHBranchOption[]>([]);
  const [contentFormatOptions, setContentFormatOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkStatusDate, setBulkStatusDate] = useState("");
  const [bulkViews, setBulkViews] = useState("");
  const [bulkReactions, setBulkReactions] = useState("");
  const [bulkCost, setBulkCost] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const { setBranchMarketingListState } = useIHMobileSelection();

  useEffect(() => {
    fetch("/api/admin/ih/branches")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBranches(data.branches))
      .catch(() => {});
    fetch("/api/admin/ih/branch-marketing/facets")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setContentFormatOptions(data.contentFormats))
      .catch(() => {});
  }, []);

  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (f.branchId) sp.set("branchId", f.branchId);
      if (f.influencerQ) sp.set("influencerQ", f.influencerQ);
      if (f.status) sp.set("status", f.status);
      if (f.contentFormat) sp.set("contentFormat", f.contentFormat);
      if (f.dateFrom) sp.set("dateFrom", f.dateFrom);
      if (f.dateTo) sp.set("dateTo", f.dateTo);
      sp.set("page", String(p));
      sp.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/ih/branch-marketing?${sp.toString()}`);
      if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchList(filters, 1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (page !== 1) fetchList(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const setField = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((prev) => ({ ...prev, [k]: e.target.value }));

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = items.length > 0 && items.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((r) => r.id)));

  const applyBulkStatus = async () => {
    if (selected.size === 0 || !bulkStatus) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/branch-marketing/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
      });
      if (res.ok) {
        setBulkStatus("");
        fetchList(filters, page);
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkStatusDate = async () => {
    if (selected.size === 0 || !bulkStatusDate) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/branch-marketing/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), support_date: bulkStatusDate }),
      });
      if (res.ok) {
        setBulkStatusDate("");
        fetchList(filters, page);
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkViews = async () => {
    if (selected.size === 0 || !bulkViews) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/branch-marketing/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), views: Number(bulkViews) }),
      });
      if (res.ok) {
        setBulkViews("");
        fetchList(filters, page);
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkReactions = async () => {
    if (selected.size === 0 || !bulkReactions) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/branch-marketing/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), reactions: Number(bulkReactions) }),
      });
      if (res.ok) {
        setBulkReactions("");
        fetchList(filters, page);
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkCost = async () => {
    if (selected.size === 0 || !bulkCost) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/branch-marketing/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), cost: Number(bulkCost) }),
      });
      if (res.ok) {
        setBulkCost("");
        fetchList(filters, page);
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emptyMessage = hasActiveFilters ? "조건에 맞는 지점 마케팅이 없습니다." : "등록된 지점 마케팅이 없습니다.";
  const emptyHint = hasActiveFilters ? "필터를 초기화해보세요." : null;

  // 지점별 성과 — 현재 필터(조회 결과) 기준. 특정 지점으로 필터하면 그 지점의 성과가 된다.
  const perf = useMemo(() => summarizeBranchPerformance(items), [items]);

  // 상태 기준으로 묶어서 보여준다 — 제품 협찬 목록과 동일하게 BRANCH_MKT_STATUS_ORDER 순서, 데이터가 있는 상태만 표시.
  const groups = useMemo(() => {
    const map = new Map<string, IHBranchMarketingListRow[]>();
    for (const r of items) {
      if (!map.has(r.status)) map.set(r.status, []);
      map.get(r.status)!.push(r);
    }
    return BRANCH_MKT_STATUS_ORDER.filter((st) => map.has(st)).map((st) => [st, map.get(st)!] as const);
  }, [items]);

  // Mobile Viewer에 현재 필터 결과를 그대로 반영(별도 조회 없이 동일 데이터 소스 사용).
  useEffect(() => {
    if (!loading) setBranchMarketingListState(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading]);
  useEffect(() => {
    return () => setBranchMarketingListState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* 필터 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 mb-3 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-1.5">
            <select value={filters.branchId} onChange={setField("branchId")} className={selectCls}>
              <option value="">지점 전체</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
            <input value={filters.influencerQ} onChange={setField("influencerQ")} placeholder="인플루언서 검색" className="w-36 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px]" />
          </div>

          <div className="w-px h-5 bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <select value={filters.status} onChange={setField("status")} className={selectCls}>
              <option value="">상태 전체</option>
              {BRANCH_MKT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{BRANCH_MKT_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <select value={filters.contentFormat} onChange={setField("contentFormat")} className={selectCls}>
              <option value="">콘텐츠 형태 전체</option>
              {contentFormatOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <input type="date" value={filters.dateFrom} onChange={setField("dateFrom")} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13.5px]" />
            <span className="text-slate-300">~</span>
            <input type="date" value={filters.dateTo} onChange={setField("dateTo")} className="rounded-md border border-slate-200 px-2 py-1.5 text-[13.5px]" />
          </div>

          <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-[13px] text-slate-500 hover:text-slate-800 ml-auto">
            필터 초기화
          </button>
        </div>
      </div>

      {/* 지점별 성과(현재 필터 결과 기준) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
        {[
          { label: "총 집행건수", value: perf.totalCount.toLocaleString("ko-KR") },
          { label: "총 비용", value: fmtCostCompact(perf.totalCost) },
          { label: "총 조회수", value: perf.totalViews.toLocaleString("ko-KR") },
          { label: "평균 조회수", value: perf.avgViews != null ? perf.avgViews.toLocaleString("ko-KR") : "-" },
          { label: "조회당 비용", value: perf.cpv != null ? fmtCostCompact(perf.cpv) : "-" },
          { label: "반응당 비용", value: perf.cpe != null ? fmtCostCompact(perf.cpe) : "-" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11.5px] text-slate-500">{s.label}</p>
            <p className="mt-0.5 text-[15px] font-bold text-slate-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 선택 항목 일괄 변경 — 상태 또는 상태 날짜 */}
      {selected.size > 0 && (
        <div className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 mb-3 flex items-center gap-3 flex-wrap">
          <span className="text-[13.5px] text-white font-semibold">{selected.size}건 선택됨</span>

          <div className="flex items-center gap-1.5">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px]"
            >
              <option value="">상태 변경...</option>
              {BRANCH_MKT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{BRANCH_MKT_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulkStatus}
              disabled={!bulkStatus || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "적용"}
            </button>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={bulkStatusDate}
              onChange={(e) => setBulkStatusDate(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px]"
            />
            <button
              type="button"
              onClick={applyBulkStatusDate}
              disabled={!bulkStatusDate || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "상태 날짜 적용"}
            </button>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={bulkViews}
              onChange={(e) => setBulkViews(e.target.value.replace(/-/g, ""))}
              placeholder="조회수"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px] placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={applyBulkViews}
              disabled={!bulkViews || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "조회수 적용"}
            </button>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={bulkReactions}
              onChange={(e) => setBulkReactions(e.target.value.replace(/-/g, ""))}
              placeholder="반응수"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px] placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={applyBulkReactions}
              disabled={!bulkReactions || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "반응수 적용"}
            </button>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={bulkCost}
              onChange={(e) => setBulkCost(e.target.value.replace(/-/g, ""))}
              placeholder="비용(원)"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px] placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={applyBulkCost}
              disabled={!bulkCost || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "비용 적용"}
            </button>
          </div>

          <button type="button" onClick={() => setSelected(new Set())} className="text-[13.5px] text-slate-300 hover:text-white ml-auto">
            선택 해제
          </button>
        </div>
      )}

      {/* 목록 */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 text-[13.5px] text-slate-600">
          전체 {loading ? "-" : total.toLocaleString("ko-KR")}건
        </div>

        {error ? (
          <p className="px-4 py-10 text-center text-[14px] text-red-500">{error}</p>
        ) : loading ? (
          <p className="px-4 py-10 text-center text-[14px] text-slate-500">불러오는 중…</p>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[14px] text-slate-500">{emptyMessage}</p>
            {emptyHint ? (
              <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-2 text-[13.5px] text-slate-600 hover:text-slate-900 underline">
                {emptyHint}
              </button>
            ) : (
              <Link href="/admin/influencer-hub/branch-marketing/new" className="mt-3 inline-block rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2">
                + 마케팅 등록
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-[14px] text-center">
              <thead>
                <tr className="text-center text-[12.5px] text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4" />
                  </th>
                  <th className="px-2 py-2 font-semibold">상태</th>
                  <th className="px-2 py-2 font-semibold">지점</th>
                  <th className="px-2 py-2 font-semibold">인플루언서</th>
                  <th className="px-2 py-2 font-semibold">상태 날짜</th>
                  <th className="px-2 py-2 font-semibold">회차</th>
                  <th className="px-2 py-2 font-semibold">비용</th>
                  <th className="px-2 py-2 font-semibold">비용주체</th>
                  <th className="px-2 py-2 font-semibold">조회수</th>
                  <th className="px-2 py-2 font-semibold">반응수</th>
                  <th className="px-2 py-2 font-semibold">콘텐츠 형태</th>
                  <th className="px-2 py-2 font-semibold">메모</th>
                  <th className="px-4 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map(([st, rows]) => (
                  <Fragment key={st}>
                    {rows.map((r) => (
                      <tr key={r.id} className={`hover:bg-slate-50 ${selected.has(r.id) ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} className="w-4 h-4" />
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 ${BRANCH_MKT_STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                            {BRANCH_MKT_STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-slate-700">{r.branchName}</td>
                        <td className="px-2 py-2.5">
                          {r.influencerId ? (
                            <Link href={`/admin/influencer-hub/branch-marketing/${r.id}`} className="font-bold underline text-blue-700 hover:text-blue-900">
                              {r.influencerNickname}
                            </Link>
                          ) : (
                            <Link href={`/admin/influencer-hub/branch-marketing/${r.id}`} className="text-slate-400 underline">
                              미매칭
                            </Link>
                          )}
                          {r.influencerChannel && <p className="text-[12px] text-slate-500">{r.influencerChannel}</p>}
                        </td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{fmtDate(r.statusDate)}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{r.round ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{fmtCostCompact(r.cost)}</td>
                        <td className="px-2 py-2.5 text-slate-600">{r.operationType ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{r.views != null ? r.views.toLocaleString("ko-KR") : "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{r.reactions != null ? r.reactions.toLocaleString("ko-KR") : "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600">{r.contentFormat ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 truncate max-w-[160px]">{r.memo ?? "-"}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/influencer-hub/branch-marketing/${r.id}/edit`}
                            className="inline-block rounded-md border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 text-[12.5px] font-semibold px-2.5 py-1"
                          >
                            수정
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-100 text-[13.5px] text-slate-600">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="disabled:opacity-30">
              이전
            </button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="disabled:opacity-30">
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
