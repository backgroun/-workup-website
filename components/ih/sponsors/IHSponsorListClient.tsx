"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { IHSponsorListRow } from "@/lib/ih/collabs";
import { summarizeSponsorPerformance } from "@/lib/ih/collabs";
import { SPONSOR_STAGE_ORDER, SPONSOR_STAGE_SELECTABLE_ORDER, SPONSOR_STAGE_LABEL, SPONSOR_STAGE_COLOR } from "@/lib/ih/influencer-shared";
import { useIHMobileSelection } from "../IHMobileSelectionContext";

const PAGE_SIZE = 20;
const selectCls = "rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px] text-slate-700 bg-white";

type Filters = {
  influencerQ: string;
  productQ: string;
  status: string;
  contentFormat: string;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_FILTERS: Filters = { influencerQ: "", productQ: "", status: "", contentFormat: "", dateFrom: "", dateTo: "" };

// "상태 날짜" 컬럼 전용 — 연도 없이 월.일만 표기.
function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}.${d}`;
}
function fmtWon(n: number | null) {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}
/** 목록의 "상태 날짜" — 업로드일이 입력돼 있으면 그걸(더 최근 단계 기준), 없으면 발송일을 보여준다. */
function statusDateOf(s: IHSponsorListRow): string | null {
  return s.uploadDate ?? s.sendDate;
}

export default function IHSponsorListClient() {
  const { setSponsorListState } = useIHMobileSelection();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IHSponsorListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentFormatOptions, setContentFormatOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkSendDate, setBulkSendDate] = useState("");
  const [bulkViews, setBulkViews] = useState("");
  const [bulkCost, setBulkCost] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ih/sponsors/facets")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setContentFormatOptions(data.contentFormats))
      .catch(() => {});
  }, []);

  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (f.influencerQ) sp.set("influencerQ", f.influencerQ);
      if (f.productQ) sp.set("productQ", f.productQ);
      if (f.status) sp.set("status", f.status);
      if (f.contentFormat) sp.set("contentFormat", f.contentFormat);
      if (f.dateFrom) sp.set("dateFrom", f.dateFrom);
      if (f.dateTo) sp.set("dateTo", f.dateTo);
      sp.set("page", String(p));
      sp.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/ih/sponsors?${sp.toString()}`);
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
    if (!loading) setSponsorListState(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading]);
  useEffect(() => () => setSponsorListState(null), [setSponsorListState]);

  const setField = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((prev) => ({ ...prev, [k]: e.target.value }));

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = items.length > 0 && items.every((s) => selected.has(s.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((s) => s.id)));

  const applyBulkStatus = async () => {
    if (selected.size === 0 || !bulkStatus) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/sponsors/bulk", {
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

  const applyBulkSendDate = async () => {
    if (selected.size === 0 || !bulkSendDate) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/sponsors/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), send_date: bulkSendDate }),
      });
      if (res.ok) {
        setBulkSendDate("");
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
      const res = await fetch("/api/admin/ih/sponsors/bulk", {
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

  const applyBulkCost = async () => {
    if (selected.size === 0 || !bulkCost) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/ih/sponsors/bulk", {
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

  // 로젠택배 대량접수 양식(송장업로드용) 다운로드 — 체크된 건이 있으면 그 건만, 없으면 현재 필터 결과 전체를 받는다.
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const downloadInvoice = async () => {
    setInvoiceDownloading(true);
    try {
      let ids = Array.from(selected);
      if (ids.length === 0) {
        const sp = new URLSearchParams();
        if (filters.influencerQ) sp.set("influencerQ", filters.influencerQ);
        if (filters.productQ) sp.set("productQ", filters.productQ);
        if (filters.status) sp.set("status", filters.status);
        if (filters.contentFormat) sp.set("contentFormat", filters.contentFormat);
        if (filters.dateFrom) sp.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) sp.set("dateTo", filters.dateTo);
        sp.set("pageSize", "5000");
        const res = await fetch(`/api/admin/ih/sponsors?${sp.toString()}`);
        if (!res.ok) return;
        const data: { items: IHSponsorListRow[] } = await res.json();
        ids = data.items.map((s) => s.id);
      }
      if (ids.length === 0) return;

      const res2 = await fetch("/api/admin/ih/sponsors/invoice-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res2.ok) return;
      const { rows } = (await res2.json()) as { rows: { receiverName: string | null; address: string | null; phone: string | null; product: string }[] };
      if (rows.length === 0) return;

      const missing = rows.filter((r) => !r.address || !r.phone);
      if (missing.length > 0) {
        const names = missing.map((r) => r.receiverName ?? "미상").join(", ");
        const proceed = window.confirm(
          `주소 또는 연락처가 비어있는 인플루언서가 ${missing.length}명 있습니다: ${names}\n\n그대로 다운로드하시겠습니까?`
        );
        if (!proceed) return;
      }

      // 로젠택배 대량접수 양식 — 헤더 없이 데이터부터 시작(B/F/G/H는 고정값, D·E엔 같은 연락처를 넣는다).
      const aoa = rows.map((r) => [r.receiverName ?? "", "", r.address ?? "", r.phone ?? "", r.phone ?? "", 1, 2600, "010", r.product]);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "엑셀파일 첫행-제목없음");

      const products = new Set(rows.map((r) => r.product));
      const productLabel = products.size === 1 ? [...products][0] : "제품다수";
      const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      XLSX.writeFile(wb, `${yymmdd}_택배발송리스트_${productLabel}_${rows.length}명.xlsx`);
    } finally {
      setInvoiceDownloading(false);
    }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emptyMessage = hasActiveFilters ? "조건에 맞는 협찬이 없습니다." : "등록된 협찬이 없습니다.";
  const emptyHint = hasActiveFilters ? "필터를 초기화해보세요." : null;

  // 상태(진행 단계) 기준으로 묶어서 보여준다 — SPONSOR_STAGE_ORDER 순서, 데이터가 있는 상태만 표시.
  const groups = useMemo(() => {
    const map = new Map<string, IHSponsorListRow[]>();
    for (const s of items) {
      if (!map.has(s.status)) map.set(s.status, []);
      map.get(s.status)!.push(s);
    }
    return SPONSOR_STAGE_ORDER.filter((st) => map.has(st)).map((st) => [st, map.get(st)!] as const);
  }, [items]);

  // 협찬 요약 — 현재 필터(조회 결과) 기준. 지점 마케팅 목록의 성과 요약과 동일한 방식.
  const perf = useMemo(() => summarizeSponsorPerformance(items), [items]);

  return (
    <div>
      {/* 필터 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 mb-3 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-1.5">
            <input value={filters.influencerQ} onChange={setField("influencerQ")} placeholder="인플루언서 검색" className="w-36 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px]" />
            <input value={filters.productQ} onChange={setField("productQ")} placeholder="제품 검색" className="w-36 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px]" />
          </div>

          <div className="w-px h-5 bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <select value={filters.status} onChange={setField("status")} className={selectCls}>
              <option value="">상태 전체</option>
              {SPONSOR_STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{SPONSOR_STAGE_LABEL[s]}</option>
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

          <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-[13.5px] text-slate-500 hover:text-slate-700 ml-auto">
            필터 초기화
          </button>
        </div>
      </div>

      {/* 협찬 요약(현재 필터 결과 기준) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
        {[
          { label: "총 집행건수", value: perf.totalCount.toLocaleString("ko-KR") },
          { label: "총 비용", value: fmtWon(perf.totalCost) },
          { label: "총 조회수", value: perf.totalViews.toLocaleString("ko-KR") },
          { label: "평균 조회수", value: perf.avgViews != null ? perf.avgViews.toLocaleString("ko-KR") : "-" },
          { label: "조회당 비용", value: perf.cpv != null ? fmtWon(perf.cpv) : "-" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11.5px] text-slate-500">{s.label}</p>
            <p className="mt-0.5 text-[15px] font-bold text-slate-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={downloadInvoice}
          disabled={invoiceDownloading || items.length === 0}
          className="rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-[13.5px] font-semibold px-3.5 py-2 transition-colors disabled:opacity-50"
        >
          {invoiceDownloading ? "다운로드 중…" : selected.size > 0 ? `송장업로드용 다운로드 (선택 ${selected.size}건)` : "송장업로드용 다운로드 (필터 결과 전체)"}
        </button>
      </div>

      {/* 선택 항목 일괄 변경 — 상태 또는 발송일 */}
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
              {SPONSOR_STAGE_SELECTABLE_ORDER.map((s) => (
                <option key={s} value={s}>{SPONSOR_STAGE_LABEL[s]}</option>
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
              value={bulkSendDate}
              onChange={(e) => setBulkSendDate(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-800 text-white px-2.5 py-1.5 text-[13.5px]"
            />
            <button
              type="button"
              onClick={applyBulkSendDate}
              disabled={!bulkSendDate || bulkSaving}
              className="rounded-md bg-white text-slate-900 text-[13.5px] font-semibold px-3.5 py-1.5 disabled:opacity-50"
            >
              {bulkSaving ? "변경 중…" : "발송일 적용"}
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
              <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-2 text-[13.5px] text-slate-600 hover:text-slate-800 underline">
                {emptyHint}
              </button>
            ) : (
              <Link href="/admin/influencer-hub/sponsors/new" className="mt-3 inline-block rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2">
                + 협찬 등록
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[14px] text-center">
              <thead>
                <tr className="text-center text-[12.5px] text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4" />
                  </th>
                  <th className="px-2 py-2 font-semibold">상태</th>
                  <th className="px-4 py-2 font-semibold">인플루언서</th>
                  <th className="px-2 py-2 font-semibold">제품</th>
                  <th className="px-2 py-2 font-semibold">회차</th>
                  <th className="px-2 py-2 font-semibold">제공 제품/사이즈</th>
                  <th className="px-2 py-2 font-semibold">상태 날짜</th>
                  <th className="px-2 py-2 font-semibold">콘텐츠 형태</th>
                  <th className="px-2 py-2 font-semibold">제품+배송비</th>
                  <th className="px-2 py-2 font-semibold">조회수</th>
                  <th className="px-4 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map(([st, rows]) => (
                  <Fragment key={st}>
                    {rows.map((s) => (
                      <tr key={s.id} className={`hover:bg-slate-50 ${selected.has(s.id) ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="w-4 h-4" />
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block rounded-full text-[12.5px] font-medium px-2 py-0.5 ${SPONSOR_STAGE_COLOR[s.status] ?? "bg-slate-100 text-slate-700"}`}>
                            {SPONSOR_STAGE_LABEL[s.status as keyof typeof SPONSOR_STAGE_LABEL] ?? s.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/influencer-hub/sponsors/${s.id}/edit`} className="font-bold underline text-blue-700 hover:text-blue-900">
                            {s.influencerNickname}
                          </Link>
                          <p className="text-[12px] text-slate-500">{s.influencerChannel} · {s.influencerFollowerDisplay ?? "-"}</p>
                        </td>
                        <td className="px-2 py-2.5 text-slate-700">{s.product}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{s.round ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 truncate max-w-[140px]">{s.supportType ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{fmtDate(statusDateOf(s))}</td>
                        <td className="px-2 py-2.5 text-slate-600">{s.contentFormat ?? "-"}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{fmtWon(s.cost)}</td>
                        <td className="px-2 py-2.5 text-slate-600 tabular-nums">{s.views != null ? s.views.toLocaleString("ko-KR") : "-"}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/influencer-hub/sponsors/${s.id}/edit`}
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
