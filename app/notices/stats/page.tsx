"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatsCalendar from "../_components/StatsCalendar";

type StoreStat = { store_id: number; store_name: string; total: number; outbound: number; pass: number };
type DailyProduct = { id: string; name: string };
type DailyRow = { notice_date: string; count: number; products: DailyProduct[]; byStore: StoreStat[] };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}(${WEEKDAYS[d.getDay()]})`;
}

function StoreStatsTable({ rows, emptyText }: { rows: StoreStat[]; emptyText: string }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">{emptyText}</div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">지점명</th>
            <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase whitespace-nowrap">전체</th>
            <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase whitespace-nowrap">출고</th>
            <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase whitespace-nowrap">패스</th>
            <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase whitespace-nowrap">패스율</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const passRate = row.total > 0 ? Math.round((row.pass / row.total) * 100) : 0;
            return (
              <tr key={row.store_id}>
                <td className="px-5 py-3 text-sm font-semibold text-gray-900">{row.store_name}</td>
                <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{row.total}건</td>
                <td className="px-5 py-3 text-sm text-emerald-600 whitespace-nowrap">{row.outbound}건</td>
                <td className="px-5 py-3 text-sm text-amber-600 whitespace-nowrap">{row.pass}건</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${passRate}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-gray-500 w-9 text-right whitespace-nowrap">{passRate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function NoticeStatsPage() {
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [byStore, setByStore] = useState<StoreStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/notices/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDaily(Array.isArray(data.daily) ? data.daily : []);
          setByStore(Array.isArray(data.byStore) ? data.byStore : []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const markedDates = useMemo(() => Object.fromEntries(daily.map((d) => [d.notice_date, d.count])), [daily]);
  const selectedDay = daily.find((d) => d.notice_date === selectedDate) ?? null;

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">통계</h1>
        <p className="text-sm text-gray-500 mt-1">
          날짜를 선택하면 그날 오픈된 상품과 지점별 패스 현황을 볼 수 있습니다. 선택하지 않으면 전체 누적 현황이 표시됩니다.
        </p>
      </div>

      <StatsCalendar
        viewMonth={viewMonth}
        onViewMonthChange={setViewMonth}
        markedDates={markedDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {selectedDay ? (
        <div className="flex gap-5 items-start">
          <section className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              {fmtDate(selectedDay.notice_date)} 오픈 목록 <span className="font-normal text-gray-400">({selectedDay.count}건)</span>
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
              {selectedDay.products.map((p, i) => (
                <Link
                  key={`${p.id}-${i}`}
                  href={`/admin/products/${p.id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 hover:text-[#303236] transition-colors"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </section>
          <section className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-700 mb-3">{fmtDate(selectedDay.notice_date)} 지점별 패스 현황</h2>
            <StoreStatsTable rows={selectedDay.byStore} emptyText="이 날짜에 접수된 패스 현황이 없습니다." />
          </section>
        </div>
      ) : (
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">지점별 패스 현황 (전체 누적)</h2>
          <StoreStatsTable rows={byStore} emptyText="아직 접수된 패스 현황이 없습니다." />
        </section>
      )}
    </div>
  );
}
