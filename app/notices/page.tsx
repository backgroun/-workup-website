"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/data/products";
import NoticeStatusSelect, { type NoticeStatus } from "./_components/NoticeStatusSelect";
import NoticeStatusLine from "./_components/NoticeStatusLine";
import PassEntriesTable from "./_components/PassEntriesTable";
import QuickEditModal from "./_components/QuickEditModal";
import NoticeExtraEditModal from "./_components/NoticeExtraEditModal";
import TempNoticeEditModal from "./_components/TempNoticeEditModal";

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
  products: { id: string; name: string; registration_status?: string } | null;
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
  // 임시등록 상태인 공지 상품을 빠르게 고치는 "공지 수정" — 전체 상품 정보를 담아야 하므로
  // (products.registration_status 등만으로는 부족) 정식등록 대기와 동일한 소스에서 통째로 가져온다.
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // 정식등록 상품 공지는 상품 자체가 아니라 공지에 덧붙는 추가 설명·사진만 수정한다.
  const [editingNotice, setEditingNotice] = useState<NoticeRow | null>(null);
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

  const loadPendingProducts = () => {
    fetch("/api/admin/notices/pending-products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPendingProducts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadNotices();
    loadPendingProducts();
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
          for (const r of data as { store_name: string; status: string; updated_at: string | null }[]) {
            allRows.push({
              "공지일자": excelDate,
              "상품명": noticeName(n),
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
                            <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                              <span
                                className={`mr-2 px-1.5 py-0.5 text-[10px] font-bold rounded whitespace-nowrap ${
                                  !n.product_id
                                    ? "bg-orange-100 text-orange-600"
                                    : n.products?.registration_status === "임시등록"
                                    ? "bg-pink-100 text-pink-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {!n.product_id ? "마감패스" : n.products?.registration_status === "임시등록" ? "임시등록" : "기등록"}
                              </span>
                              {noticeName(n)}
                            </td>
                            <td className="px-5 py-3">
                              <NoticeStatusSelect
                                noticeId={n.id}
                                status={n.status}
                                onChanged={(status, data) =>
                                  setNotices((prev) => prev.map((x) => (x.id === n.id ? { ...x, status, ...data } : x)))
                                }
                              />
                            </td>
                            <td className="px-5 py-3 text-right whitespace-nowrap">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!n.product_id) {
                                      setEditingTempNotice(n);
                                    } else if (n.products?.registration_status === "임시등록") {
                                      const product = pendingProducts.find((p) => p.id === n.products?.id);
                                      if (product) setEditingProduct(product);
                                    } else {
                                      setEditingNotice(n);
                                    }
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

      {editingProduct && (
        <QuickEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setPendingProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setNotices((prev) =>
              prev.map((n) =>
                n.products?.id === updated.id ? { ...n, products: { ...n.products!, name: updated.name } } : n
              )
            );
            setEditingProduct(null);
          }}
        />
      )}

      {editingNotice && (
        <NoticeExtraEditModal
          noticeId={editingNotice.id}
          productName={editingNotice.products?.name}
          initialExtraImages={editingNotice.extra_images}
          onClose={() => setEditingNotice(null)}
          onSaved={({ extra_images }) => {
            setNotices((prev) =>
              prev.map((n) => (n.id === editingNotice.id ? { ...n, extra_images } : n))
            );
            setEditingNotice(null);
          }}
        />
      )}

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
