"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

const RANGES = [
  { label: "최근 7일", days: 7 },
  { label: "최근 30일", days: 30 },
  { label: "최근 90일", days: 90 },
  { label: "전체", days: 0 },
];

const RANK_BADGE = ["bg-[#ff550c] text-white", "bg-amber-400 text-white", "bg-amber-300 text-amber-900"];

export default function StoreAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [stores, setStores] = useState<StoreStat[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stores/analytics?days=${days}`)
      .then((r) => (r.ok ? r.json() : { stores: [], totals: null }))
      .then((d) => {
        setStores(d.stores ?? []);
        setTotals(d.totals ?? null);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const summary = [
    { label: "지점 조회", value: totals?.view ?? 0, color: "text-gray-900" },
    { label: "길찾기", value: totals?.directions ?? 0, color: "text-[#1A2B4A]" },
    { label: "전화 문의", value: totals?.call ?? 0, color: "text-emerald-600" },
    { label: "카카오톡 상담", value: totals?.kakao_chat ?? 0, color: "text-yellow-600" },
    { label: "전환 합계", value: totals?.conversions ?? 0, color: "text-[#ff550c]" },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/stores" className="hover:text-gray-900">스토어 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">방문 분석</span>
      </div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">방문 분석</h1>
          <p className="text-base text-gray-400 mt-1">지점별 조회·길찾기·전화·상담 등 전환 행동을 집계합니다.</p>
        </div>
        <div className="flex gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3.5 py-2 text-sm font-medium transition-colors ${days === r.days ? "bg-[#1A2B4A] text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
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
                  <p className="text-base font-medium mb-1">아직 수집된 데이터가 없습니다.</p>
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
