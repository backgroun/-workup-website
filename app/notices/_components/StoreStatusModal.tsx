"use client";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

// 매장 DB(stores)에는 없는 운영 참고 정보(담당자·연락처·이메일 등) — site_settings(store_status)에 저장.
// 엑셀 재업로드로 통째로 갱신하거나, 표에서 행 단위로 직접 수정할 수 있다.
type StoreStatusRow = {
  code: string;
  name: string;
  manager: string;
  contact: string;
  shipNotice: string;
  email: string;
  address: string;
  openedAt: string;
};

type StoreStatusConfig = { rows: StoreStatusRow[]; updatedAt: string | null };

const COLUMNS: { key: keyof StoreStatusRow; label: string }[] = [
  { key: "code", label: "코드" },
  { key: "name", label: "매장명" },
  { key: "manager", label: "담당자" },
  { key: "contact", label: "연락처" },
  { key: "shipNotice", label: "출고안내번호" },
  { key: "email", label: "이메일" },
  { key: "address", label: "주소" },
  { key: "openedAt", label: "오픈일" },
];

// 엑셀 헤더(아이디매칭/매장명/담당자/연락처/출고안내번호/이메일/주소/오픈일)를 내부 필드로 매핑.
function parseExcelRows(file: ArrayBuffer): StoreStatusRow[] {
  const wb = XLSX.read(file, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return raw
    .map((r) => ({
      code: String(r["아이디매칭"] ?? "").trim(),
      name: String(r["매장명"] ?? "").trim(),
      manager: String(r["담당자"] ?? "").trim(),
      contact: String(r["연락처"] ?? "").trim(),
      shipNotice: String(r["출고안내번호"] ?? "").trim(),
      email: String(r["이메일"] ?? "").trim(),
      address: String(r["주소"] ?? "").trim(),
      openedAt: String(r["오픈일"] ?? "").trim(),
    }))
    .filter((r) => r.name);
}

export default function StoreStatusModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<StoreStatusRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<StoreStatusRow | null>(null);
  const [isNewRow, setIsNewRow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const showInfo = (text: string) => {
    setInfo(text);
    setTimeout(() => setInfo(""), 4000);
  };

  const load = () => {
    setLoading(true);
    fetch("/api/admin/site-settings/store_status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StoreStatusConfig | null) => {
        setRows(data?.rows ?? []);
        setUpdatedAt(data?.updatedAt ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveRows = async (next: StoreStatusRow[]) => {
    setSaving(true);
    setError("");
    try {
      const config: StoreStatusConfig = { rows: next, updatedAt: new Date().toISOString() };
      const res = await fetch("/api/admin/site-settings/store_status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "저장에 실패했습니다.");
        return false;
      }
      setRows(next);
      setUpdatedAt(config.updatedAt);
      return true;
    } catch {
      setError("네트워크 오류로 저장에 실패했습니다.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseExcelRows(buf);
      if (parsed.length === 0) {
        setError("엑셀에서 읽은 행이 없습니다. 양식을 확인해 주세요.");
        return;
      }
      if (!confirm(`엑셀 ${parsed.length}개 행으로 지점 현황 전체를 덮어씁니다. 계속할까요?`)) return;
      const ok = await saveRows(parsed);
      if (ok) showInfo(`${parsed.length}개 행을 반영했습니다.`);
    } catch {
      setError("엑셀 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setDraft({ ...rows[idx] });
    setIsNewRow(false);
  };

  // 새 행은 화면에서만 먼저 추가하고, 실제로는 "저장"을 눌러야 반영된다.
  // 취소하면 화면에서만 추가됐던 빈 행을 그냥 제거한다.
  const addRow = () => {
    const empty: StoreStatusRow = {
      code: "", name: "", manager: "", contact: "", shipNotice: "", email: "", address: "", openedAt: "",
    };
    setRows((prev) => [empty, ...prev]);
    setEditIdx(0);
    setDraft({ ...empty });
    setIsNewRow(true);
  };

  const cancelEdit = () => {
    if (isNewRow && editIdx !== null) {
      setRows((prev) => prev.filter((_, i) => i !== editIdx));
    }
    setEditIdx(null);
    setDraft(null);
    setIsNewRow(false);
  };

  const saveEdit = async () => {
    if (editIdx === null || !draft) return;
    if (!draft.name.trim()) {
      setError("매장명은 비워둘 수 없습니다.");
      return;
    }
    const next = rows.map((r, i) => (i === editIdx ? draft : r));
    const ok = await saveRows(next);
    if (ok) {
      showInfo("저장했습니다.");
      setEditIdx(null);
      setDraft(null);
      setIsNewRow(false);
    }
  };

  const deleteRow = async (idx: number) => {
    if (!confirm(`"${rows[idx].name}" 행을 삭제할까요?`)) return;
    const next = rows.filter((_, i) => i !== idx);
    const ok = await saveRows(next);
    if (ok) showInfo("삭제했습니다.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <span className="font-bold text-[16px] text-gray-900">지점 현황</span>
            <p className="text-xs text-gray-400 mt-0.5">
              매장 DB에 없는 담당자·연락처·이메일 등 참고 정보 (관리자 전용)
              {updatedAt && ` · 마지막 업데이트 ${new Date(updatedAt).toLocaleString("ko-KR")}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={addRow}
              disabled={editIdx !== null}
              className="px-3 py-1.5 text-[13px] font-semibold bg-[#303236] text-white rounded-lg hover:bg-[#1f2124] disabled:opacity-50"
            >
              + 지점 추가
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-[13px] font-semibold border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "엑셀 업로드"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        {(info || error) && (
          <div className="px-5 pt-3 flex-shrink-0">
            {info && <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-lg">{info}</div>}
            {error && <div className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
          </div>
        )}

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              아직 데이터가 없습니다. &quot;엑셀 업로드&quot;로 지점 현황을 등록해 주세요.
            </div>
          ) : (
            <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, idx) => {
                  const isEditing = editIdx === idx;
                  return (
                    <tr key={r.code || idx} className={isEditing ? "bg-amber-50/60" : "hover:bg-gray-50"}>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="px-3 py-2 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              value={draft?.[c.key] ?? ""}
                              onChange={(e) => setDraft((d) => (d ? { ...d, [c.key]: e.target.value } : d))}
                              className="w-full min-w-[90px] border border-gray-200 rounded px-2 py-1 text-[13px] focus:outline-none focus:border-[#303236]"
                            />
                          ) : (
                            <span className={c.key === "code" ? "font-mono text-gray-500" : "text-gray-700"}>
                              {r[c.key] || "-"}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving}
                              className="px-2.5 py-1 text-[12px] font-semibold bg-[#303236] text-white rounded hover:bg-[#1f2124] disabled:opacity-50"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-2.5 py-1 text-[12px] font-semibold text-gray-500 border border-gray-200 rounded hover:bg-gray-50"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => startEdit(idx)}
                              disabled={editIdx !== null}
                              className="px-2.5 py-1 text-[12px] font-semibold text-gray-600 border border-gray-200 rounded hover:border-gray-400 disabled:opacity-40"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRow(idx)}
                              disabled={editIdx !== null || saving}
                              className="px-2.5 py-1 text-[12px] font-semibold text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-40"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
