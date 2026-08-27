"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IHBrandedPplListRow } from "@/lib/ih/collabs";
import {
  BRANDED_PPL_STATUS_ORDER,
  BRANDED_PPL_STATUS_LABEL,
  BRANDED_PPL_STATUS_COLOR,
  BRANDED_PPL_CATEGORY_ORDER,
  BRANDED_PPL_CATEGORY_LABEL,
  BRANDED_PPL_CATEGORY_COLOR,
  fmtCostManwon,
  formatFollowerDisplay,
} from "@/lib/ih/influencer-shared";
import { useIHMobileSelection } from "../IHMobileSelectionContext";

const PAGE_SIZE = 20;
const selectCls = "rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px] text-slate-700 bg-white";

type Filters = {
  nameQ: string;
  status: string;
  category: string;
};
const DEFAULT_FILTERS: Filters = { nameQ: "", status: "", category: "" };

/** 목록에서는 날짜만 짧게(예: "8.27") — 시간까지는 상세 페이지에서 확인한다. */
function fmtUpdatedDateOnly(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** 구독자/팔로워 수를 "1.3만" 형태로 표시 — 구분 없이 없으면 "-". */
function fmtSubscriber(r: IHBrandedPplListRow): string {
  return r.subscriberCount != null ? formatFollowerDisplay(r.subscriberCount) : "-";
}

/** "광고상품" 칸 — 연예인은 광고상품 개념이 없으니 계약 기준(기간)을 대신 보여준다. */
function adProductOrPeriod(r: IHBrandedPplListRow): string {
  if (r.category === "CELEBRITY") return r.contractPeriod ?? "-";
  return r.adProduct ?? "-";
}

export default function IHBrandedPplListClient() {
  const { setBrandedPplListState } = useIHMobileSelection();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IHBrandedPplListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkCost, setBulkCost] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (f.nameQ) sp.set("nameQ", f.nameQ);
      if (f.status) sp.set("status", f.status);
      if (f.category) sp.set("category", f.category);
      sp.set("page", String(p));
      sp.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/ih/branded-ppl?${sp.toString()}`);
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

  // Mobile Viewer가 이 페이지의 필터 결과를 그대로 재사용하도록 공유 Context에 반영한다(별도 조회 없음).
  useEffect(() => {
    if (!loading) setBrandedPplListState(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading]);
  useEffect(() => () => setBrandedPplListState(null), [setBrandedPplListState]);

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

  const applyBulk = async (patch: { status?: string } | { category?: string } | { cost?: number | null }) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/branded-ppl/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), ...patch }),
      });
      if (res.ok) {
        setBulkStatus("");
        setBulkCategory("");
        setBulkCost("");
        fetchList(filters, page);
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emptyMessage = hasActiveFilters ? "조건에 맞는 브랜디드 PPL이 없습니다." : "등록된 브랜디드 PPL이 없습니다.";
  const emptyHint = hasActiveFilters ? "필터를 초기화해보세요." : null;

  // 구분 → 상태 순으로 묶어서 보여준다(연예인/PPL/인플루언서 순).
  const groups = useMemo(() => {
    const map = new Map<string, IHBrandedPplListRow[]>();
    for (const r of items) {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    return BRANDED_PPL_CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [items]);

  return (
    <div>
      {/* 필터 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 mb-3 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <input value={filters.nameQ} onChange={setField("nameQ")} placeholder="모델명/채널명/인플루언서명 검색" className="w-56 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px]" />

          <div className="w-px h-5 bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <select value={filters.category} onChange={setField("category")} className={selectCls}>
              <option value="">구분 전체</option>
              {BRANDED_PPL_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{BRANDED_PPL_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            <select value={filters.status} onChange={setField("status")} className={selectCls}>
              <option value="">상태 전체</option>
              {BRANDED_PPL_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{BRANDED_PPL_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-[13.5px] text-slate-500 hover:text-slate-700 ml-auto">
            필터 초기화
          </button>
        </div>
      </div>

      {/* 선택 항목 일괄 변경 — 상태/구분/단가 */}
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
              {BRANDED_PPL_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{BRANDED_PPL_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => applyBulk({ status: bulkStatus })}
              disabled={!bulkStatus || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "적용"}
            </button>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px]"
            >
              <option value="">구분 변경...</option>
              {BRANDED_PPL_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{BRANDED_PPL_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => applyBulk({ category: bulkCategory })}
              disabled={!bulkCategory || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "적용"}
            </button>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={bulkCost}
              onChange={(e) => setBulkCost(e.target.value.replace(/-/g, ""))}
              placeholder="단가(원)"
              className="w-28 rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px] placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => applyBulk({ cost: Number(bulkCost) })}
              disabled={!bulkCost || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "단가 적용"}
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
              <Link href="/admin/influencer-hub/branded-ppl/new" className="mt-3 inline-block rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2">
                + PPL 등록
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-[14px] text-center">
              <thead>
                <tr className="text-center text-[12.5px] text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4" />
                  </th>
                  <th className="px-4 py-2 font-semibold">구분</th>
                  <th className="px-2 py-2 font-semibold">상태</th>
                  <th className="px-2 py-2 font-semibold">이름</th>
                  <th className="px-2 py-2 font-semibold">구독자</th>
                  <th className="px-2 py-2 font-semibold">광고상품</th>
                  <th className="px-2 py-2 font-semibold">특징</th>
                  <th className="px-2 py-2 font-semibold">단가</th>
                  <th className="px-2 py-2 font-semibold">최근 업데이트</th>
                  <th className="px-4 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map(([cat, rows]) => (
                  <Fragment key={cat}>
                    {rows.map((r) => (
                      <tr key={r.id} className={`hover:bg-slate-50 ${selected.has(r.id) ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} className="w-4 h-4" />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 ${BRANDED_PPL_CATEGORY_COLOR[r.category] ?? "bg-slate-100 text-slate-700"}`}>
                            {BRANDED_PPL_CATEGORY_LABEL[r.category] ?? r.category}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 ${BRANDED_PPL_STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                            {BRANDED_PPL_STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <Link href={`/admin/influencer-hub/branded-ppl/${r.id}`} className="font-bold underline text-blue-700 hover:text-blue-900">
                            {r.name}
                          </Link>
                          {r.category === "PPL" && r.mainCast && <p className="text-[12px] text-slate-500">{r.mainCast}</p>}
                        </td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{fmtSubscriber(r)}</td>
                        <td className="px-2 py-2.5 text-slate-600">{adProductOrPeriod(r)}</td>
                        <td className="px-2 py-2.5 text-slate-600">{r.memo ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{fmtCostManwon(r.cost)}</td>
                        <td className="px-2 py-2.5 text-slate-500 tabular-nums whitespace-nowrap">{fmtUpdatedDateOnly(r.updatedAt)}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.channelLink && (
                              <a
                                href={r.channelLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 text-[12.5px] font-semibold px-2.5 py-1"
                              >
                                채널
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                            <Link
                              href={`/admin/influencer-hub/branded-ppl/${r.id}/edit`}
                              className="inline-block rounded-md border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 text-[12.5px] font-semibold px-2.5 py-1"
                            >
                              수정
                            </Link>
                          </div>
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
