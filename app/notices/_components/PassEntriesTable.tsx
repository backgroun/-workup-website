"use client";
import { useEffect, useMemo, useState, useCallback } from "react";

type PassRow = { store_id: number; store_name: string; store_code: string | null; status: "출고" | "패스"; updated_at: string | null };

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PassEntriesTable({ noticeId, noticeDate }: { noticeId: string; noticeDate: string }) {
  const [rows, setRows] = useState<PassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyPass, setOnlyPass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}/pass-entries`);
      const data = await res.json();
      if (res.ok) setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [noticeId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      출고: rows.filter((r) => r.status === "출고").length,
      패스: rows.filter((r) => r.status === "패스").length,
    }),
    [rows]
  );

  const filteredRows = useMemo(() => {
    let list = rows;
    if (onlyPass) list = list.filter((r) => r.status === "패스");
    if (query.trim()) list = list.filter((r) => r.store_name.includes(query.trim()));
    return list;
  }, [rows, onlyPass, query]);

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const sheetRows = rows.map((r) => ({
      "지점코드": r.store_code ?? "",
      "지점명": r.store_name,
      "상태": r.status,
      "변경 시각": r.updated_at ? new Date(r.updated_at).toLocaleString("ko-KR") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "패스현황");
    XLSX.writeFile(wb, `패스현황_${noticeDate}.xlsx`);
  };

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-gray-900 text-base">{stats.total}</span>
          <span className="text-gray-400">전체</span>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-emerald-600">{stats.출고}</span>
          <span className="text-gray-400">출고</span>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-amber-600">{stats.패스}</span>
          <span className="text-gray-400">패스</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="지점명 검색"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#303236]"
          />
          <button
            onClick={() => setOnlyPass((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-full border ${
              onlyPass ? "bg-[#303236] text-white border-[#303236]" : "border-gray-200 text-gray-600"
            }`}
          >
            패스만 보기
          </button>
          <button
            onClick={downloadExcel}
            className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:border-[#303236]"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[55vh]">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">지점명</th>
              <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">상태</th>
              <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">변경 시각</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map((r) => (
              <tr key={r.store_id}>
                <td className="px-5 py-3 text-sm text-gray-900">{r.store_name}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2.5 py-0.5 text-[12px] font-semibold rounded-full ${
                      r.status === "패스" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-400 font-mono">{fmtTime(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
