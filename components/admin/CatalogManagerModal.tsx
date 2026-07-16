"use client";
import { useState, useEffect, useRef } from "react";

// 브랜드/제조사 관리 팝업 — 제품 목록 페이지에서 바로 열어 CRUD.
// (기존 /admin/brands 페이지의 Section 로직을 모달용으로 재사용)

type Item = { id: number; name: string; name_ko?: string | null };

function CrudSection({ title, apiPath, addPlaceholder, withAlias }: {
  title: string; apiPath: string; addPlaceholder: string; withAlias?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [newNameKo, setNewNameKo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingNameKo, setEditingNameKo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { const d = await fetch(apiPath).then((r) => r.json()); if (Array.isArray(d)) setItems(d); } catch { /* noop */ }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [apiPath]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true); setError("");
    const r = await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim(), name_ko: withAlias ? newNameKo.trim() : undefined }) });
    if (r.ok) { setNewName(""); setNewNameKo(""); await load(); inputRef.current?.focus(); }
    else { const d = await r.json().catch(() => ({})); setError(d.error ?? "오류가 발생했습니다."); }
    setSaving(false);
  };
  const startEdit = (it: Item) => { setEditingId(it.id); setEditingName(it.name); setEditingNameKo(it.name_ko ?? ""); setTimeout(() => editRef.current?.focus(), 50); };
  const cancelEdit = () => { setEditingId(null); setEditingName(""); setEditingNameKo(""); };
  const handleEdit = async (id: number) => {
    if (!editingName.trim()) return;
    setSaving(true);
    const r = await fetch(apiPath, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editingName.trim(), name_ko: withAlias ? editingNameKo.trim() : undefined }) });
    if (r.ok) { cancelEdit(); await load(); } else { const d = await r.json().catch(() => ({})); setError(d.error ?? "수정 중 오류가 발생했습니다."); }
    setSaving(false);
  };
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}"을 삭제하시겠습니까?`)) return;
    await fetch(apiPath, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="text-xs font-bold text-[#303236]">{items.length}개</span>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        {error && <p className="text-xs text-red-500 mb-1.5">{error}</p>}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input ref={inputRef} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={addPlaceholder}
            className="flex-1 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-[#303236]" />
          {withAlias && (
            <input value={newNameKo} onChange={(e) => setNewNameKo(e.target.value)} placeholder="한글 검색명 (선택)"
              className="flex-1 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-[#303236]" />
          )}
          <button type="submit" disabled={saving || !newName.trim()}
            className="px-4 py-2 bg-[#303236] text-white text-sm font-semibold rounded hover:bg-[#243d5e] disabled:opacity-50 whitespace-nowrap">
            {saving ? "…" : "추가"}
          </button>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[46vh]">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 hover:bg-gray-50 group">
                {editingId === it.id ? (
                  <>
                    <div className="flex w-full gap-2">
                      <input ref={editRef} value={editingName} onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(it.id); if (e.key === "Escape") cancelEdit(); }}
                        className="min-w-0 flex-1 border border-blue-400 px-2.5 py-1.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      {withAlias && (
                        <input value={editingNameKo} onChange={(e) => setEditingNameKo(e.target.value)} placeholder="한글 검색명"
                          onKeyDown={(e) => { if (e.key === "Enter") handleEdit(it.id); if (e.key === "Escape") cancelEdit(); }}
                          className="min-w-0 flex-1 border border-blue-400 px-2.5 py-1.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      )}
                    </div>
                    <div className="flex w-full justify-end gap-2">
                      <button onClick={() => handleEdit(it.id)} disabled={saving} className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50">저장</button>
                      <button onClick={cancelEdit} className="px-2.5 py-1.5 border border-gray-200 text-gray-500 text-xs rounded hover:bg-gray-100">취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                      {it.name}
                      {withAlias && it.name_ko && <span className="ml-2 font-normal text-gray-400">{it.name_ko}</span>}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => startEdit(it)} className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50">수정</button>
                      <button onClick={() => handleDelete(it.id, it.name)} className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50">삭제</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CatalogManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#303236]">브랜드 / 제조사 관리</h2>
            <p className="text-xs text-gray-400 mt-0.5">제품 등록 시 선택할 브랜드·제조사 목록을 관리합니다.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <CrudSection title="브랜드 관리" apiPath="/api/admin/brands" addPlaceholder="브랜드명 (예: WORKUP)" withAlias />
          <CrudSection title="제조사 관리" apiPath="/api/admin/manufacturers" addPlaceholder="제조사명 (예: 워크업코리아)" />
        </div>
      </div>
    </div>
  );
}
