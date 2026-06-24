"use client";
import { useState, useEffect } from "react";
import { DEFAULT_PEOPLE, type Person, type PersonProduct } from "@/data/people";
import AdminImageField from "@/components/admin/AdminImageField";

const DEFAULT_HEADER = {
  title: "일하는 사람이 제일 멋있다.",
  description: "워크업이 만드는 옷의 주인공은 제품이 아닙니다.\n매일 현장에서 땀 흘리는 사람들의 이야기입니다.",
};

type PageHeader = { title: string; description: string };
type PageData = { header?: PageHeader; items?: Person[] };

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function emptyPerson(): Person {
  return {
    id: uid(), job: "", years: "", quote: "", story: [""], theme: "",
    products: [{ name: "", href: "/products" }], bg: "#1A2B4A", initial: "",
  };
}

export default function AdminMainPeoplePage() {
  const [header, setHeader]     = useState<PageHeader>({ ...DEFAULT_HEADER });
  const [items, setItems]       = useState<Person[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [toast, setToast]       = useState("");
  const [editing, setEditing]   = useState<Person | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver]   = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings/people_page")
      .then(r => r.json())
      .then((data: PageData | null) => {
        if (data?.header) setHeader(data.header);
        setItems(data?.items?.length ? data.items : DEFAULT_PEOPLE);
      })
      .catch(() => setItems(DEFAULT_PEOPLE))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  const saveAll = async (list: Person[]) => {
    const rollback = items;   // 호출 시점의 이전 목록 — 낙관적 갱신 실패 시 복원
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/people_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: list }),
      });
      if (!r.ok) setItems(rollback);
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.");
    } catch {
      setItems(rollback);
      flash("저장에 실패했습니다.");
    } finally { setSaving(false); }
  };

  const saveHeader = async () => {
    setHeaderSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/people_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items }),
      });
      flash(r.ok ? "상단 텍스트가 저장됐습니다." : "저장에 실패했습니다.");
    } finally { setHeaderSaving(false); }
  };

  const openNew = () => { setEditing(emptyPerson()); setIsNew(true); };
  const openEdit = (p: Person) => { setEditing(JSON.parse(JSON.stringify(p))); setIsNew(false); };

  const handleSave = async () => {
    if (!editing) return;
    const cleaned: Person = {
      ...editing,
      story: editing.story.map(s => s.trim()).filter(Boolean),
      products: editing.products.filter(pr => pr.name.trim()),
    };
    const updated = isNew ? [...items, cleaned] : items.map(p => p.id === cleaned.id ? cleaned : p);
    setItems(updated);
    setEditing(null);
    await saveAll(updated);
  };

  const handleDuplicate = async (p: Person) => {
    const copy: Person = { ...JSON.parse(JSON.stringify(p)), id: uid(), job: `${p.job} (복사본)` };
    const idx = items.findIndex(x => x.id === p.id);
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    setItems(next);
    await saveAll(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 인물을 삭제할까요?")) return;
    const updated = items.filter(p => p.id !== id);
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

  const set = <K extends keyof Person>(k: K, v: Person[K]) =>
    setEditing(prev => prev ? { ...prev, [k]: v } : prev);

  // story 헬퍼
  const setStoryLine = (i: number, v: string) =>
    setEditing(prev => prev ? { ...prev, story: prev.story.map((s, idx) => idx === i ? v : s) } : prev);
  const addStoryLine = () => setEditing(prev => prev ? { ...prev, story: [...prev.story, ""] } : prev);
  const removeStoryLine = (i: number) =>
    setEditing(prev => prev ? { ...prev, story: prev.story.filter((_, idx) => idx !== i) } : prev);

  // products 헬퍼
  const setProduct = (i: number, patch: Partial<PersonProduct>) =>
    setEditing(prev => prev ? { ...prev, products: prev.products.map((p, idx) => idx === i ? { ...p, ...patch } : p) } : prev);
  const addProduct = () => setEditing(prev => prev ? { ...prev, products: [...prev.products, { name: "", href: "/products" }] } : prev);
  const removeProduct = (i: number) =>
    setEditing(prev => prev ? { ...prev, products: prev.products.filter((_, idx) => idx !== i) } : prev);

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MATE 관리</h1>
          <p className="mt-1 text-sm text-gray-500">/people 페이지에 노출되는 인물 인터뷰를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            인물 추가
          </button>
        </div>
      </div>

      {/* ── 상단 텍스트 편집 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">페이지 상단 텍스트</h2>
            <p className="text-xs text-slate-400 mt-0.5">MATE 페이지 최상단에 표시되는 제목과 소개 문구입니다.</p>
          </div>
          <button onClick={saveHeader} disabled={headerSaving}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
            {headerSaving ? "저장 중..." : "저장"}
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">제목</label>
            <input
              type="text"
              value={header.title}
              onChange={e => setHeader(h => ({ ...h, title: e.target.value }))}
              placeholder="일하는 사람이 제일 멋있다."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">소개 문구 <span className="font-normal text-gray-400">(\n으로 줄 나눔)</span></label>
            <textarea
              rows={3}
              value={header.description}
              onChange={e => setHeader(h => ({ ...h, description: e.target.value }))}
              placeholder="워크업이 만드는 옷의 주인공은 제품이 아닙니다."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* 목록 */}
        <div className="w-[300px] flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">인물 목록 ({items.length})</h2>
              <span className="text-xs text-slate-400">드래그로 순서 변경</span>
            </div>
            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">등록된 인물이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((p, i) => (
                  <li key={p.id} draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${editing?.id === p.id ? "bg-blue-50" : "hover:bg-slate-50"} ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold mt-0.5" style={{ backgroundColor: p.bg }}>{p.initial || "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.job || "(직종 없음)"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{p.quote || p.years}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <button onClick={() => openEdit(p)} className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2 py-0.5 hover:bg-slate-100 rounded">수정</button>
                        <button onClick={() => handleDuplicate(p)} className="text-[11px] font-medium text-blue-500 border border-blue-200 px-2 py-0.5 hover:bg-blue-50 rounded">복제</button>
                        <button onClick={() => handleDelete(p.id)} className="text-[11px] font-medium text-red-400 border border-red-200 px-2 py-0.5 hover:bg-red-50 rounded">삭제</button>
                      </div>
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
                <h2 className="text-base font-semibold text-white">{isNew ? "새 인물 추가" : "인물 수정"}</h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">직종</label>
                    <input type="text" value={editing.job} onChange={e => set("job", e.target.value)} placeholder="예: 건설 현장직"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">경력</label>
                    <input type="text" value={editing.years} onChange={e => set("years", e.target.value)} placeholder="예: 경력 15년"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">아바타 글자</label>
                    <input type="text" maxLength={2} value={editing.initial} onChange={e => set("initial", e.target.value)} placeholder="건"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">배경색</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={editing.bg} onChange={e => set("bg", e.target.value)} className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                      <input type="text" value={editing.bg} onChange={e => set("bg", e.target.value)} className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                      <div className="flex-1 h-9 rounded border border-gray-100 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: editing.bg }}>{editing.initial || "미리보기"}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">인용구</label>
                  <input type="text" value={editing.quote} onChange={e => set("quote", e.target.value)} placeholder="현장에서 옷이 불편하면 사고 납니다."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500">이야기 (문단)</label>
                    <button type="button" onClick={addStoryLine} className="text-xs text-blue-600 hover:text-blue-800">+ 문단 추가</button>
                  </div>
                  <div className="space-y-2">
                    {editing.story.map((line, i) => (
                      <div key={i} className="flex gap-2">
                        <textarea value={line} onChange={e => setStoryLine(i, e.target.value)} rows={2}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                        {editing.story.length > 1 && (
                          <button type="button" onClick={() => removeStoryLine(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <AdminImageField
                  value={editing.image_url}
                  onChange={url => set("image_url", url)}
                  promptType="person"
                  promptSeed={`${editing.job}${editing.theme ? `, ${editing.theme}` : ""}`}
                  label="인물 사진 (등록 시 아바타 대신 표시)"
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">중요하게 여기는 것</label>
                  <input type="text" value={editing.theme} onChange={e => set("theme", e.target.value)} placeholder="안전과 움직임"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500">추천 상품</label>
                    <button type="button" onClick={addProduct} className="text-xs text-blue-600 hover:text-blue-800">+ 상품 추가</button>
                  </div>
                  <div className="space-y-2">
                    {editing.products.map((pr, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input type="text" value={pr.name} onChange={e => setProduct(i, { name: e.target.value })} placeholder="상품명"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                        <input type="text" value={pr.href} onChange={e => setProduct(i, { href: e.target.value })} placeholder="/products"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                        <button type="button" onClick={() => removeProduct(i)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">취소</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-3">
              <p>목록에서 인물을 선택하거나 새 인물을 추가하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
