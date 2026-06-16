"use client";
import { useState, useEffect } from "react";
import { DEFAULT_TESTS, type Test, type DataPoint } from "@/data/field-test";
import AdminImageField from "@/components/admin/AdminImageField";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function emptyTest(): Test {
  return {
    id: uid(), category: "", product: "", title: "", subtitle: "",
    conditions: [""], data: [{ spec: "", plain: "" }], feedback: "",
  };
}

export default function AdminFieldTestPage() {
  const [items, setItems]       = useState<Test[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const [editing, setEditing]   = useState<Test | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver]   = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings/field_test_page")
      .then(r => r.json())
      .then((data: { items?: Test[] } | null) => {
        setItems(data?.items?.length ? data.items : DEFAULT_TESTS);
      })
      .catch(() => setItems(DEFAULT_TESTS))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  const saveAll = async (list: Test[]) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/field_test_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: list }),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.");
    } finally { setSaving(false); }
  };

  const openNew = () => { setEditing(emptyTest()); setIsNew(true); };
  const openEdit = (t: Test) => { setEditing(JSON.parse(JSON.stringify(t))); setIsNew(false); };

  const handleSave = async () => {
    if (!editing) return;
    const cleaned: Test = {
      ...editing,
      conditions: editing.conditions.map(c => c.trim()).filter(Boolean),
      data: editing.data.filter(d => d.spec.trim() || d.plain.trim()),
    };
    const updated = isNew ? [...items, cleaned] : items.map(t => t.id === cleaned.id ? cleaned : t);
    setItems(updated);
    setEditing(null);
    await saveAll(updated);
  };

  const handleDuplicate = async (t: Test) => {
    const copy: Test = { ...JSON.parse(JSON.stringify(t)), id: uid(), title: `${t.title} (복사본)` };
    const idx = items.findIndex(x => x.id === t.id);
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    setItems(next);
    await saveAll(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 테스트를 삭제할까요?")) return;
    const updated = items.filter(t => t.id !== id);
    setItems(updated);
    if (editing?.id === id) setEditing(null);
    await saveAll(updated);
  };

  const handleDrop = async (target: number) => {
    if (dragIndex === null || dragIndex === target) { setDragIndex(null); setDragOver(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDragIndex(null); setDragOver(null);
    await saveAll(next);
  };

  const set = <K extends keyof Test>(k: K, v: Test[K]) =>
    setEditing(prev => prev ? { ...prev, [k]: v } : prev);

  // conditions
  const setCond = (i: number, v: string) => setEditing(p => p ? { ...p, conditions: p.conditions.map((c, idx) => idx === i ? v : c) } : p);
  const addCond = () => setEditing(p => p ? { ...p, conditions: [...p.conditions, ""] } : p);
  const removeCond = (i: number) => setEditing(p => p ? { ...p, conditions: p.conditions.filter((_, idx) => idx !== i) } : p);

  // data points
  const setDP = (i: number, patch: Partial<DataPoint>) => setEditing(p => p ? { ...p, data: p.data.map((d, idx) => idx === i ? { ...d, ...patch } : d) } : p);
  const addDP = () => setEditing(p => p ? { ...p, data: [...p.data, { spec: "", plain: "" }] } : p);
  const removeDP = (i: number) => setEditing(p => p ? { ...p, data: p.data.filter((_, idx) => idx !== i) } : p);

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FIELD TEST 관리</h1>
          <p className="mt-1 text-sm text-gray-500">/field-test 페이지에 노출되는 제품 검증 콘텐츠를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            테스트 추가
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* 목록 */}
        <div className="w-[300px] flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">테스트 목록 ({items.length})</h2>
              <span className="text-xs text-slate-400">드래그로 순서 변경</span>
            </div>
            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">등록된 테스트가 없습니다.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((t, i) => (
                  <li key={t.id} draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                    className={`px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${editing?.id === t.id ? "bg-blue-50" : "hover:bg-slate-50"} ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    <p className="text-[11px] text-[#ff550c] font-semibold truncate">{t.category || "(분류 없음)"}</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{t.product || "(제품 없음)"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{t.title}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button onClick={() => openEdit(t)} className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2 py-0.5 hover:bg-slate-100 rounded">수정</button>
                      <button onClick={() => handleDuplicate(t)} className="text-[11px] font-medium text-blue-500 border border-blue-200 px-2 py-0.5 hover:bg-blue-50 rounded">복제</button>
                      <button onClick={() => handleDelete(t.id)} className="text-[11px] font-medium text-red-400 border border-red-200 px-2 py-0.5 hover:bg-red-50 rounded">삭제</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 편집 폼 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">{isNew ? "새 테스트 추가" : "테스트 수정"}</h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">테스트 분류</label>
                    <input type="text" value={editing.category} onChange={e => set("category", e.target.value)} placeholder="예: 방수 테스트"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">제품명</label>
                    <input type="text" value={editing.product} onChange={e => set("product", e.target.value)} placeholder="예: 경량 방풍 자켓 A형"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">테스트 제목</label>
                  <input type="text" value={editing.title} onChange={e => set("title", e.target.value)} placeholder="폭우 8시간 방수 테스트"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">부제</label>
                  <input type="text" value={editing.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="20,000mm 방수 수치 현장 검증"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>

                <AdminImageField
                  value={editing.image_url}
                  onChange={url => set("image_url", url)}
                  promptType="product"
                  promptSeed={`${editing.product}${editing.category ? `, ${editing.category}` : ""}${editing.title ? `, ${editing.title}` : ""}`}
                  label="테스트 이미지"
                />

                {/* 테스트 조건 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500">테스트 조건</label>
                    <button type="button" onClick={addCond} className="text-xs text-blue-600 hover:text-blue-800">+ 조건 추가</button>
                  </div>
                  <div className="space-y-2">
                    {editing.conditions.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={c} onChange={e => setCond(i, e.target.value)} placeholder="예: 8시간 연속 착용"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                        {editing.conditions.length > 1 && <button type="button" onClick={() => removeCond(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 수치 → 현장 언어 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500">수치 → 현장 언어</label>
                    <button type="button" onClick={addDP} className="text-xs text-blue-600 hover:text-blue-800">+ 항목 추가</button>
                  </div>
                  <div className="space-y-2">
                    {editing.data.map((d, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input type="text" value={d.spec} onChange={e => setDP(i, { spec: e.target.value })} placeholder="수치 (예: 방수 20,000mm)"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                        <input type="text" value={d.plain} onChange={e => setDP(i, { plain: e.target.value })} placeholder="현장 언어 (예: 폭우에도 안 젖습니다)"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                        {editing.data.length > 1 && <button type="button" onClick={() => removeDP(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">착용자 피드백</label>
                  <textarea value={editing.feedback} onChange={e => set("feedback", e.target.value)} rows={3} placeholder="실제 현장 착용 테스트 결과를 적어주세요."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
                  <button onClick={() => setEditing(null)} className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">취소</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-3">
              <p>목록에서 테스트를 선택하거나 새 테스트를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
