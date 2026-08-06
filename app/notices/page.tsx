"use client";
import { useEffect, useState } from "react";
import NoticeStatusSelect, { type NoticeStatus } from "./_components/NoticeStatusSelect";
import NoticeStatusLine from "./_components/NoticeStatusLine";
import PassEntriesTable from "./_components/PassEntriesTable";
import TempNoticeEditModal from "./_components/TempNoticeEditModal";
import { useIsPastClose } from "@/lib/hooks/useIsPastClose";

const DEFAULT_CLOSE_TIME = "14:00";

// 공지는 이제 항상 마감패스 전용(products 테이블 미연결)으로만 등록된다.
type NoticeRow = {
  id: string;
  product_id: string | null;
  notice_date: string;
  status: NoticeStatus;
  opened_at: string | null;
  closed_at: string | null;
  description: string | null;
  extra_images: string[];
  temp_name: string | null;
  temp_image_url: string | null;
  temp_tagline: string | null;
  products: { id: string; name: string } | null;
};

const STATIC_NAV = [
  { key: "new", label: "공지 상품 선택", src: "/notices/new?embed=1" },
  { key: "detail", label: "마감 패스 현황", src: null as string | null },
  { key: "deadline", label: "마감 관리", src: "/notices/deadline?embed=1" },
  { key: "stores", label: "지점 링크 관리", src: "/notices/stores?embed=1" },
  { key: "stats", label: "통계", src: "/notices/stats?embed=1" },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
function fmtNoticeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}(${WEEKDAYS[d.getDay()]})`;
}

// 정식 상품(products) 공지든 마감패스 전용(temp_name) 공지든 상관없이 표시용 이름 하나로.
function noticeName(n: NoticeRow): string {
  return n.products?.name ?? n.temp_name ?? "상품 정보 없음";
}

export default function NoticesPreviewPage() {
  // ── 관리자 화면 ──
  const [adminTab, setAdminTab] = useState("detail");
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // 마감패스 전용(product_id 없음) 공지는 이름·썸네일·설명을 공지에서 직접 수정한다.
  const [editingTempNotice, setEditingTempNotice] = useState<NoticeRow | null>(null);

  const loadNotices = () => {
    setNoticesLoading(true);
    fetch("/api/admin/notices")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNotices(list);
        setSelectedNoticeId((prev) => prev ?? (list[0] ? list[0].id : null));
      })
      .finally(() => setNoticesLoading(false));
  };

  // 마감 관리에서 설정한 마감 시각 — 자동 마감 크론(하루 1회)이 아직 안 돌았어도
  // 브라우저 시계 기준으로 마감 시각이 지났으면 화면에서 즉시 "마감"임을 알려준다.
  const [closeTime, setCloseTime] = useState(DEFAULT_CLOSE_TIME);
  const isPastClose = useIsPastClose(closeTime);

  useEffect(() => {
    loadNotices();
    fetch("/api/admin/site-settings/notice_schedule")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCloseTime(data?.closeTime || DEFAULT_CLOSE_TIME));
  }, []);

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`"${name ?? "이 공지"}" 공지를 삭제할까요?\n접수된 패스 현황도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        setSelectedNoticeId((prev) => (prev === id ? null : prev));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "삭제에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류로 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const currentSrc = adminTab === "detail" ? null : STATIC_NAV.find((n) => n.key === adminTab)?.src ?? null;
  const selectedNotice = notices.find((n) => n.id === selectedNoticeId) ?? null;

  // 마감 패스 현황 — 일자 선택 후 그날 공지 전체(여러 상품 포함)의 패스 현황을 엑셀로 한 번에 다운로드
  const uniqueDates = [...new Set(notices.map((n) => n.notice_date))].sort().reverse();
  const [excelDate, setExcelDate] = useState("");
  const [excelDownloading, setExcelDownloading] = useState(false);

  useEffect(() => {
    if (!excelDate && uniqueDates.length > 0) setExcelDate(uniqueDates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices]);

  const downloadDateExcel = async () => {
    if (!excelDate) return;
    const dateNotices = notices.filter((n) => n.notice_date === excelDate);
    if (dateNotices.length === 0) return;
    setExcelDownloading(true);
    try {
      const XLSX = await import("xlsx");
      const allRows: Record<string, string>[] = [];
      for (const n of dateNotices) {
        const res = await fetch(`/api/admin/notices/${n.id}/pass-entries`);
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const r of data as { store_name: string; store_code: string | null; status: string; updated_at: string | null }[]) {
            allRows.push({
              "공지일자": excelDate,
              "상품명": noticeName(n),
              "지점코드": r.store_code ?? "",
              "지점명": r.store_name,
              "상태": r.status,
              "변경 시각": r.updated_at ? new Date(r.updated_at).toLocaleString("ko-KR") : "",
            });
          }
        }
      }
      const ws = XLSX.utils.json_to_sheet(allRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "패스현황");
      XLSX.writeFile(wb, `패스현황_${excelDate}.xlsx`);
    } finally {
      setExcelDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-5">
          <nav className="w-48 flex-shrink-0 space-y-1">
            {STATIC_NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setAdminTab(n.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  adminTab === n.key ? "bg-[#303236] text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>

          {adminTab === "detail" ? (
            <div className="flex-1 min-w-0">
              {noticesLoading ? (
                <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : notices.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  아직 생성된 공지가 없습니다. &quot;공지 상품 선택&quot;에서 먼저 만들어 주세요.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={excelDate}
                      onChange={(e) => setExcelDate(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#303236]"
                    >
                      {uniqueDates.map((d) => (
                        <option key={d} value={d}>
                          {fmtNoticeDate(d)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={downloadDateExcel}
                      disabled={excelDownloading || !excelDate}
                      className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:border-[#303236] disabled:opacity-50"
                    >
                      {excelDownloading ? "다운로드 중..." : "선택 일자 엑셀 다운로드"}
                    </button>
                  </div>
                  <div className="flex gap-5 items-start">
                  <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase whitespace-nowrap">공지일자</th>
                          <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">상품명</th>
                          <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">상태</th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {notices.map((n) => (
                          <tr
                            key={n.id}
                            onClick={() => setSelectedNoticeId(n.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedNoticeId === n.id ? "bg-gray-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-5 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">{fmtNoticeDate(n.notice_date)}</td>
                            <td className="px-5 py-3 text-sm font-semibold text-gray-900">{noticeName(n)}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <NoticeStatusSelect
                                  noticeId={n.id}
                                  status={n.status}
                                  onChanged={(status, data) =>
                                    setNotices((prev) => prev.map((x) => (x.id === n.id ? { ...x, status, ...data } : x)))
                                  }
                                />
                                {n.status === "진행중" && isPastClose && (
                                  <span className="text-[11px] font-semibold text-amber-600 whitespace-nowrap" title="마감 시각이 지났습니다. 자동 마감 처리를 기다리는 중입니다.">
                                    마감 시각 경과
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right whitespace-nowrap">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTempNotice(n);
                                  }}
                                  className="px-2.5 py-1.5 text-[12px] font-semibold text-gray-600 border border-gray-300 rounded-lg hover:border-[#303236] hover:text-[#303236]"
                                >
                                  공지 수정
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(n.id, noticeName(n));
                                  }}
                                  disabled={deletingId === n.id || n.status !== "마감"}
                                  title={n.status !== "마감" ? "마감된 공지만 삭제할 수 있습니다." : undefined}
                                  className="px-2.5 py-1.5 text-[12px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {deletingId === n.id ? "삭제 중..." : "삭제"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    {selectedNotice ? (
                      <>
                        <NoticeStatusLine
                          noticeId={selectedNotice.id}
                          productName={noticeName(selectedNotice)}
                          status={selectedNotice.status}
                          openedAt={selectedNotice.opened_at}
                          closedAt={selectedNotice.closed_at}
                          pastCloseHint={isPastClose}
                          onChanged={(status, data) =>
                            setNotices((prev) => prev.map((n) => (n.id === selectedNotice.id ? { ...n, status, ...data } : n)))
                          }
                        />
                        <PassEntriesTable noticeId={selectedNotice.id} noticeDate={selectedNotice.notice_date} />
                      </>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">
                        공지를 선택하면 출고·패스 현황이 표시됩니다.
                      </div>
                    )}
                  </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: "85vh" }}>
              {currentSrc && <iframe key={currentSrc} src={currentSrc} className="w-full h-full border-0" title={adminTab} />}
            </div>
          )}
      </div>

      {editingTempNotice && (
        <TempNoticeEditModal
          noticeId={editingTempNotice.id}
          initialName={editingTempNotice.temp_name ?? ""}
          initialImageUrl={editingTempNotice.temp_image_url}
          initialTagline={editingTempNotice.temp_tagline}
          initialExtraImages={editingTempNotice.extra_images}
          onClose={() => setEditingTempNotice(null)}
          onSaved={(data) => {
            setNotices((prev) => prev.map((n) => (n.id === editingTempNotice.id ? { ...n, ...data } : n)));
            setEditingTempNotice(null);
          }}
        />
      )}
    </div>
  );
}
