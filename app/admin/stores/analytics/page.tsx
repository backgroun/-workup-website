"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

type StoreStat = {
  store_id: number | null;
  store_name: string;
  view: number;
  list_click: number;
  directions_kakao: number;
  directions_naver: number;
  call: number;
  kakao_chat: number;
  conversions: number;
};

type Totals = {
  view: number;
  list_click: number;
  directions: number;
  call: number;
  kakao_chat: number;
  conversions: number;
};

type Range = { type: "preset"; days: number } | { type: "custom"; from: string; to: string };

const PRESETS = [
  { label: "최근 7일", days: 7 },
  { label: "최근 30일", days: 30 },
  { label: "최근 90일", days: 90 },
  { label: "전체", days: 0 },
];

const RANK_BADGE = ["bg-[#ff550c] text-white", "bg-amber-400 text-white", "bg-amber-300 text-amber-900"];

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default function StoreAnalyticsPage() {
  const [range, setRange] = useState<Range>({ type: "preset", days: 30 });
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [stores, setStores] = useState<StoreStat[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  const rangeLabel = useMemo(
    () =>
      range.type === "preset"
        ? PRESETS.find((p) => p.days === range.days)?.label ?? `${range.days}일`
        : `${range.from} ~ ${range.to}`,
    [range],
  );

  useEffect(() => {
    const qs =
      range.type === "preset"
        ? `days=${range.days}`
        : `from=${range.from}&to=${range.to}`;
    setLoading(true);
    fetch(`/api/admin/stores/analytics?${qs}`)
      .then((r) => (r.ok ? r.json() : { stores: [], totals: null }))
      .then((d) => {
        setStores(d.stores ?? []);
        setTotals(d.totals ?? null);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const summary = [
    { label: "지점 조회", value: totals?.view ?? 0, color: "text-gray-900" },
    { label: "길찾기", value: totals?.directions ?? 0, color: "text-[#1A2B4A]" },
    { label: "전화 문의", value: totals?.call ?? 0, color: "text-emerald-600" },
    { label: "카카오톡 상담", value: totals?.kakao_chat ?? 0, color: "text-yellow-600" },
    { label: "전환 합계", value: totals?.conversions ?? 0, color: "text-[#ff550c]" },
  ];

  const downloadExcel = () => {
    if (stores.length === 0) return;
    const header = ["순위", "지점", "조회", "길찾기(카카오)", "길찾기(네이버)", "전화", "카카오톡", "리스트클릭", "전환합계"];
    const rows = stores.map((s, i) => [
      i + 1, s.store_name, s.view, s.directions_kakao, s.directions_naver, s.call, s.kakao_chat, s.list_click, s.conversions,
    ]);
    const totalRow = totals
      ? ["", "합계", totals.view, "", "", totals.call, totals.kakao_chat, totals.list_click, totals.conversions]
      : null;
    const aoa = [
      [`워크업 지점 방문 분석 — 기간: ${rangeLabel}`],
      [],
      header,
      ...rows,
      ...(totalRow ? [totalRow] : []),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = header.map((_, i) => ({ wch: i === 1 ? 26 : 13 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "방문분석");
    const tag = range.type === "preset" ? rangeLabel.replace(/\s/g, "") : `${range.from}_${range.to}`;
    XLSX.writeFile(wb, `workup_방문분석_${tag}.xlsx`);
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/stores" className="hover:text-gray-900">스토어 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">방문 분석</span>
      </div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">방문 분석</h1>
          <p className="text-base text-gray-400 mt-1">지점별 조회·길찾기·전화·상담 등 전환 행동을 집계합니다.</p>
        </div>
        <button
          onClick={downloadExcel}
          disabled={stores.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel 다운로드
        </button>
      </div>

      {/* 기간 선택 */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setRange({ type: "preset", days: p.days })}
              className={`px-3.5 py-2 text-sm font-medium transition-colors ${range.type === "preset" && range.days === p.days ? "bg-[#1A2B4A] text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">직접 설정</span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
          />
          <button
            onClick={() => from && to && setRange({ type: "custom", from, to })}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${range.type === "custom" ? "bg-[#1A2B4A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            조회
          </button>
        </div>
        <p className="text-sm text-gray-400 ml-auto">기간: {rangeLabel}</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {summary.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* 지점별 순위 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">지점별 순위 (전환 많은 순)</h2>
          <p className="text-sm text-gray-400">{stores.length}개 지점</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["순위", "지점", "조회", "길찾기(카)", "길찾기(네)", "전화", "카톡", "리스트", "전환합계"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap ${i <= 1 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />
                    불러오는 중...
                  </div>
                </td></tr>
              ) : stores.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                  <p className="text-base font-medium mb-1">이 기간에 수집된 데이터가 없습니다.</p>
                  <p className="text-sm">고객이 매장 페이지를 조회하거나 길찾기·전화를 누르면 여기에 집계됩니다.</p>
                </td></tr>
              ) : (
                stores.map((s, i) => (
                  <tr key={s.store_id ?? s.store_name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full ${RANK_BADGE[i] ?? "bg-gray-100 text-gray-500"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900">
                      {s.store_id ? (
                        <Link href={`/store/${s.store_id}`} target="_blank" className="hover:text-[#ff550c] hover:underline">
                          {s.store_name}
                        </Link>
                      ) : s.store_name}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600">{s.view.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-gray-600">{s.directions_kakao.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-gray-600">{s.directions_naver.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-emerald-600">{s.call.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-yellow-600">{s.kakao_chat.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-gray-400">{s.list_click.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#ff550c]">{s.conversions.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        · 전환합계 = 길찾기(카카오+네이버) + 전화 + 카카오톡 상담. 실제 방문·문의로 이어지는 행동입니다.
      </p>
    </div>
  );
}
