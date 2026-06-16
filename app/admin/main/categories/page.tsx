"use client";

import { useEffect, useRef, useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────
type CatItem = { name: string; subs: string[] };

type QuickCategoryItem = {
  id: string; name: string; emoji: string; icon_url: string;
  bg_color: string; link: string; open_in_new_tab: boolean; is_visible: boolean;
};
type QuickCategoriesConfig = {
  is_section_visible: boolean; display_count: number; items: QuickCategoryItem[];
};

// ── 기본값 ─────────────────────────────────────────────────────
const DEFAULT_CATS: CatItem[] = [
  { name: "현장", subs: ["상의", "하의", "계절·기능", "안전용품"] },
  { name: "여성", subs: ["여성 상의", "여성 하의", "여성 아우터"] },
  { name: "소품", subs: ["가방", "모자", "장갑", "양말", "벨트", "기타"] },
  { name: "남성", subs: ["남성 상의", "남성 하의", "남성 아우터", "신발"] },
  { name: "공용", subs: ["공용 상의", "공용 하의", "공용 아우터"] },
  { name: "일상", subs: ["데일리웨어", "아우터", "팬츠"] },
];

const DEFAULT_QC: QuickCategoriesConfig = {
  is_section_visible: true,
  display_count: 6,
  items: [
    { id: "1", name: "공용",  emoji: "👥", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
    { id: "2", name: "남성",  emoji: "👔", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
    { id: "3", name: "여성",  emoji: "👗", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
    { id: "4", name: "소품",  emoji: "🎒", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
    { id: "5", name: "현장",  emoji: "⛏️", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
    { id: "6", name: "일상",  emoji: "👕", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
  ],
};

// ── 헬퍼 ──────────────────────────────────────────────────────
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function parseLinkMain(link: string): string {
  try { return new URL(link, "http://x").searchParams.get("category") ?? ""; } catch { return ""; }
}
function parseLinkSub(link: string): string {
  try { return new URL(link, "http://x").searchParams.get("sub") ?? ""; } catch { return ""; }
}
function buildLink(main: string, sub: string): string {
  if (!main) return "/products";
  if (!sub) return `/products?category=${encodeURIComponent(main)}`;
  return `/products?category=${encodeURIComponent(main)}&sub=${encodeURIComponent(sub)}`;
}

// ══════════════════════════════════════════════════════════════
export default function AdminCombinedCategoriesPage() {

  // ── 카테고리 관리 state ──
  const [cats, setCats] = useState<CatItem[]>(DEFAULT_CATS);
  const [catLoading, setCatLoading] = useState(true);
  const [catSaving, setCatSaving] = useState(false);
  const [catSaveMsg, setCatSaveMsg] = useState<"ok" | "err" | null>(null);
  const [newMain, setNewMain] = useState("");
  const [newSubInputs, setNewSubInputs] = useState<Record<number, string>>({});
  const [editingMain, setEditingMain] = useState<number | null>(null);
  const [editMainVal, setEditMainVal] = useState("");
  const [selectedCatIdx, setSelectedCatIdx] = useState<number>(0);

  // ── 퀵 카테고리 state ──
  const [qcConfig, setQcConfig] = useState<QuickCategoriesConfig>(DEFAULT_QC);
  const [qcLoading, setQcLoading] = useState(true);
  const [qcDbError, setQcDbError] = useState(false);
  const [qcSaving, setQcSaving] = useState(false);
  const [qcSaveMsg, setQcSaveMsg] = useState<"ok" | "err" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 퀵 카테고리 피커: 각 아이템별 피커에서 "현재 보고 있는 대카테고리"
  const [pickerMain, setPickerMain] = useState<Record<string, string>>({});

  // ── 데이터 로드 ──
  useEffect(() => {
    fetch("/api/admin/site-settings/categories")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.categories && Array.isArray(data.categories)) setCats(data.categories);
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));

    fetch("/api/admin/site-settings/quick_categories")
      .then(r => { if (!r.ok) { setQcDbError(true); return null; } return r.json(); })
      .then(data => { if (data?.items) setQcConfig(data as QuickCategoriesConfig); })
      .finally(() => setQcLoading(false));
  }, []);

  // ── 카테고리 관리 함수 ──
  async function saveCats() {
    setCatSaving(true); setCatSaveMsg(null);
    const res = await fetch("/api/admin/site-settings/categories", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: cats }),
    });
    setCatSaving(false);
    setCatSaveMsg(res.ok ? "ok" : "err");
    setTimeout(() => setCatSaveMsg(null), 2500);
  }

  function addMainCat() {
    const name = newMain.trim();
    if (!name || cats.some(c => c.name === name)) return;
    setCats([...cats, { name, subs: [] }]);
    setNewMain("");
  }
  function deleteMainCat(idx: number) {
    if (!confirm(`"${cats[idx].name}" 카테고리를 삭제하시겠습니까?\n하위 카테고리도 모두 삭제됩니다.`)) return;
    setCats(cats.filter((_, i) => i !== idx));
  }
  function moveMain(idx: number, dir: -1 | 1) {
    const next = [...cats];
    const to = idx + dir;
    if (to < 0 || to >= next.length) return;
    [next[idx], next[to]] = [next[to], next[idx]];
    setCats(next);
  }
  function startEditMain(idx: number) { setEditingMain(idx); setEditMainVal(cats[idx].name); }
  function commitEditMain(idx: number) {
    const name = editMainVal.trim();
    if (name && !cats.some((c, i) => i !== idx && c.name === name)) {
      const next = [...cats];
      next[idx] = { ...next[idx], name };
      setCats(next);
    }
    setEditingMain(null);
  }
  function addSub(catIdx: number) {
    const val = (newSubInputs[catIdx] ?? "").trim();
    if (!val || cats[catIdx].subs.includes(val)) {
      setNewSubInputs(p => ({ ...p, [catIdx]: "" })); return;
    }
    const next = [...cats];
    next[catIdx] = { ...next[catIdx], subs: [...next[catIdx].subs, val] };
    setCats(next);
    setNewSubInputs(p => ({ ...p, [catIdx]: "" }));
  }
  function deleteSub(catIdx: number, subIdx: number) {
    const next = [...cats];
    next[catIdx] = { ...next[catIdx], subs: next[catIdx].subs.filter((_, i) => i !== subIdx) };
    setCats(next);
  }
  function moveSub(catIdx: number, subIdx: number, dir: -1 | 1) {
    const next = [...cats];
    const subs = [...next[catIdx].subs];
    const to = subIdx + dir;
    if (to < 0 || to >= subs.length) return;
    [subs[subIdx], subs[to]] = [subs[to], subs[subIdx]];
    next[catIdx] = { ...next[catIdx], subs };
    setCats(next);
  }

  // ── 퀵 카테고리 함수 ──
  async function saveQc(cfg: QuickCategoriesConfig) {
    setQcSaving(true); setQcSaveMsg(null);
    const res = await fetch("/api/admin/site-settings/quick_categories", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setQcSaving(false);
    setQcSaveMsg(res.ok ? "ok" : "err");
    setTimeout(() => setQcSaveMsg(null), 2500);
  }
  function updateItem(id: string, patch: Partial<QuickCategoryItem>) {
    setQcConfig(prev => ({ ...prev, items: prev.items.map(it => it.id === id ? { ...it, ...patch } : it) }));
  }
  function moveItem(index: number, dir: -1 | 1) {
    const next = [...qcConfig.items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQcConfig(prev => ({ ...prev, items: next }));
  }
  function addItem() {
    const newItem: QuickCategoryItem = {
      id: newId(), name: "새 카테고리", emoji: "📦", icon_url: "",
      bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true,
    };
    setQcConfig(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setEditingId(newItem.id);
  }
  function deleteItem(id: string) {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    setQcConfig(prev => ({ ...prev, items: prev.items.filter(it => it.id !== id) }));
    if (editingId === id) setEditingId(null);
  }
  async function handleIconFile(id: string, file: File) {
    setUploadingId(id);
    setUploadErr(prev => ({ ...prev, [id]: "" }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "업로드 실패");
      updateItem(id, { icon_url: json.url });
    } catch (e) {
      setUploadErr(prev => ({ ...prev, [id]: e instanceof Error ? e.message : "업로드 실패" }));
    } finally { setUploadingId(null); }
  }

  const visibleCount = qcConfig.items.filter(it => it.is_visible).length;

  // ── 로딩 ──
  if (catLoading || qcLoading) {
    return (
      <div className="flex items-center gap-3 py-20 text-base text-gray-400">
        <span className="w-6 h-6 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin" />
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">카테고리 관리</h1>
        <p className="text-sm text-gray-500 mt-1">카테고리 구조와 퀵 카테고리를 함께 관리합니다.</p>
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ══ 왼쪽: 카테고리 관리 ══════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">카테고리 구조</h2>
              <p className="text-xs text-gray-400 mt-0.5">대카테고리 · 하위카테고리 2단계 구조</p>
            </div>
            <div className="flex items-center gap-2">
              {catSaveMsg && (
                <span className={`text-xs font-medium ${catSaveMsg === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {catSaveMsg === "ok" ? "저장됐습니다 ✓" : "저장 실패"}
                </span>
              )}
              <button onClick={saveCats} disabled={catSaving}
                className="px-4 py-2 bg-[#1A2B4A] text-white text-sm font-semibold hover:bg-[#243d5e] disabled:opacity-50 transition-colors rounded-lg">
                {catSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {cats.map((cat, catIdx) => (
                <div key={catIdx}>
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/60">
                    <div className="flex gap-1">
                      <button onClick={() => moveMain(catIdx, -1)} disabled={catIdx === 0}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs rounded border border-gray-200 bg-white">↑</button>
                      <button onClick={() => moveMain(catIdx, 1)} disabled={catIdx === cats.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs rounded border border-gray-200 bg-white">↓</button>
                    </div>
                    {editingMain === catIdx ? (
                      <input autoFocus value={editMainVal}
                        onChange={e => setEditMainVal(e.target.value)}
                        onBlur={() => commitEditMain(catIdx)}
                        onKeyDown={e => { if (e.key === "Enter") commitEditMain(catIdx); if (e.key === "Escape") setEditingMain(null); }}
                        className="flex-1 border border-[#1A2B4A] px-2 py-1 text-sm font-bold text-[#1A2B4A] focus:outline-none rounded-lg" />
                    ) : (
                      <button onClick={() => startEditMain(catIdx)}
                        className="flex-1 text-left text-[14px] font-bold text-gray-800 hover:text-[#ff550c] transition-colors">
                        {cat.name}
                        <span className="ml-2 text-[11px] font-normal text-gray-400">클릭하여 수정</span>
                      </button>
                    )}
                    <span className="text-[12px] text-gray-400">{cat.subs.length}개</span>
                    <button onClick={() => deleteMainCat(catIdx)}
                      className="px-2.5 py-1 text-[12px] border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      삭제
                    </button>
                  </div>
                  <div className="px-5 py-3">
                    {cat.subs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {cat.subs.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center gap-1 border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-1 text-[12px]">
                            <div className="flex gap-0.5">
                              <button onClick={() => moveSub(catIdx, subIdx, -1)} disabled={subIdx === 0}
                                className="text-[9px] text-gray-300 hover:text-gray-600 disabled:opacity-20">◀</button>
                              <button onClick={() => moveSub(catIdx, subIdx, 1)} disabled={subIdx === cat.subs.length - 1}
                                className="text-[9px] text-gray-300 hover:text-gray-600 disabled:opacity-20">▶</button>
                            </div>
                            <span className="text-gray-700">{sub}</span>
                            <button onClick={() => deleteSub(catIdx, subIdx)}
                              className="text-gray-300 hover:text-red-500 text-sm leading-none ml-0.5">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={newSubInputs[catIdx] ?? ""}
                        onChange={e => setNewSubInputs(p => ({ ...p, [catIdx]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSub(catIdx); } }}
                        placeholder={`"${cat.name}" 하위 카테고리 추가`}
                        className="flex-1 border border-gray-200 px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#1A2B4A] rounded-lg" />
                      <button type="button" onClick={() => addSub(catIdx)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-[12px] hover:bg-gray-200 transition-colors rounded-lg font-medium">
                        추가
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">+ 대카테고리 추가</p>
            <div className="flex gap-2">
              <input value={newMain} onChange={e => setNewMain(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMainCat(); } }}
                placeholder="새 대카테고리 이름 (예: 안전용품)"
                className="flex-1 border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:border-[#1A2B4A] rounded-lg" />
              <button type="button" onClick={addMainCat}
                className="px-4 py-2 bg-[#1A2B4A] text-white text-[12px] font-semibold hover:bg-[#243d5e] transition-colors rounded-lg">
                추가
              </button>
            </div>
          </div>
        </div>

        {/* ══ 오른쪽: 퀵 카테고리 관리 ════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">퀵 카테고리</h2>
              <p className="text-xs text-gray-400 mt-0.5">메인 화면 퀵 카테고리 그리드</p>
            </div>
            <div className="flex items-center gap-2">
              {qcSaveMsg && (
                <span className={`text-xs font-medium ${qcSaveMsg === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {qcSaveMsg === "ok" ? "저장됐습니다 ✓" : "저장 실패"}
                </span>
              )}
              <button onClick={() => saveQc(qcConfig)} disabled={qcSaving}
                className="px-4 py-2 bg-[#ff550c] text-white text-sm font-semibold hover:bg-[#e04400] disabled:opacity-50 transition-colors rounded-lg">
                {qcSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          {/* 전체 설정 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">섹션 노출</p>
                <p className="text-[11px] text-gray-400 mt-0.5">메인 페이지에서 퀵 카테고리 섹션 전체 표시 여부</p>
              </div>
              <button onClick={() => setQcConfig(p => ({ ...p, is_section_visible: !p.is_section_visible }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${qcConfig.is_section_visible ? "bg-[#1A2B4A]" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${qcConfig.is_section_visible ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-700">최대 노출 수</p>
                <p className="text-[11px] text-gray-400 mt-0.5">노출 켜진 항목 중 상위 N개 표시 (현재 {visibleCount}개 노출 가능)</p>
              </div>
              <select value={qcConfig.display_count}
                onChange={e => setQcConfig(p => ({ ...p, display_count: Number(e.target.value) }))}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30">
                {[4, 5, 6, 7, 8, 10, 12].map(n => <option key={n} value={n}>{n}개</option>)}
              </select>
            </div>
          </div>

          {/* 퀵 카테고리 목록 */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">항목 목록</h3>
              <span className="text-xs text-gray-400">총 {qcConfig.items.length}개</span>
            </div>

            {qcConfig.items.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">등록된 카테고리가 없습니다.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {qcConfig.items.map((item, index) => (
                  <li key={item.id} className={`transition-colors ${editingId === item.id ? "bg-[#f8f9ff]" : "hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                        style={{ backgroundColor: item.bg_color }}>
                        {item.icon_url
                          ? <img src={item.icon_url} alt={item.name} className="w-5 h-5 object-contain" />
                          : <span className="leading-none select-none">{item.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 truncate font-mono">{item.link}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${item.is_visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.is_visible ? "노출" : "숨김"}
                      </span>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-[10px]">▲</button>
                        <button onClick={() => moveItem(index, 1)} disabled={index === qcConfig.items.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-[10px]">▼</button>
                      </div>
                      <button onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0">
                        {editingId === item.id ? "닫기" : "편집"}
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex-shrink-0">
                        삭제
                      </button>
                    </div>

                    {/* 편집 패널 */}
                    {editingId === item.id && (
                      <div className="mx-4 mb-4 p-4 bg-white border border-[#d0d8f0] rounded-xl">
                        <div className="grid grid-cols-2 gap-3">

                          {/* 카테고리명 */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리명</label>
                            <input type="text" value={item.name}
                              onChange={e => updateItem(item.id, { name: e.target.value })}
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                              placeholder="예: 남성" />
                          </div>

                          {/* 이모지 */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">이모지 (이미지 없을 때)</label>
                            <input type="text" value={item.emoji}
                              onChange={e => updateItem(item.id, { emoji: e.target.value })}
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                              placeholder="예: 👔" />
                          </div>

                          {/* ── 연결 카테고리 피커 ── */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-2">연결 카테고리</label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* 브레드크럼 */}
                              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
                                {parseLinkMain(item.link) ? (
                                  <>
                                    <span className="font-semibold text-[#1A2B4A]">{parseLinkMain(item.link)}</span>
                                    <span className="text-gray-300">›</span>
                                    {parseLinkSub(item.link)
                                      ? <span className="font-semibold text-[#1A2B4A]">{parseLinkSub(item.link)}</span>
                                      : <span className="text-gray-400">소분류 전체</span>}
                                  </>
                                ) : (
                                  <span className="text-gray-400">전체 제품</span>
                                )}
                              </div>
                              {/* 2단 패널 */}
                              <div className="flex" style={{ height: "160px" }}>
                                {/* 왼쪽: 대카테고리 */}
                                <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                                  {/* 전체 제품 */}
                                  <button type="button"
                                    onClick={() => { updateItem(item.id, { link: "/products" }); setPickerMain(p => ({ ...p, [item.id]: "" })); }}
                                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors border-b border-gray-50 ${!parseLinkMain(item.link) ? "bg-blue-50 text-[#1A2B4A] font-semibold" : "hover:bg-gray-50 text-gray-500"}`}>
                                    전체 제품
                                  </button>
                                  {cats.map(cat => (
                                    <button key={cat.name} type="button"
                                      onClick={() => {
                                        setPickerMain(p => ({ ...p, [item.id]: cat.name }));
                                        updateItem(item.id, { link: buildLink(cat.name, "") });
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 ${
                                        (pickerMain[item.id] ?? parseLinkMain(item.link)) === cat.name
                                          ? "bg-blue-50 text-[#1A2B4A] font-semibold"
                                          : "hover:bg-gray-50 text-gray-700"
                                      }`}>
                                      <span>{cat.name}</span>
                                      <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  ))}
                                </div>
                                {/* 오른쪽: 소카테고리 */}
                                <div className="w-1/2 overflow-y-auto">
                                  {(() => {
                                    const activeMain = pickerMain[item.id] ?? parseLinkMain(item.link);
                                    const activeSubs = cats.find(c => c.name === activeMain)?.subs ?? [];
                                    if (!activeMain) return (
                                      <div className="flex items-center justify-center h-full">
                                        <p className="text-xs text-gray-400 text-center px-4">왼쪽에서<br />대카테고리 선택</p>
                                      </div>
                                    );
                                    return (
                                      <>
                                        <button type="button"
                                          onClick={() => updateItem(item.id, { link: buildLink(activeMain, "") })}
                                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors border-b border-gray-50 ${!parseLinkSub(item.link) && parseLinkMain(item.link) === activeMain ? "bg-blue-50 text-[#1A2B4A] font-semibold" : "hover:bg-gray-50 text-gray-500"}`}>
                                          전체
                                        </button>
                                        {activeSubs.map(sub => (
                                          <button key={sub} type="button"
                                            onClick={() => updateItem(item.id, { link: buildLink(activeMain, sub) })}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 ${
                                              parseLinkSub(item.link) === sub && parseLinkMain(item.link) === activeMain
                                                ? "bg-blue-50 text-[#1A2B4A] font-semibold"
                                                : "hover:bg-gray-50 text-gray-700"
                                            }`}>
                                            <span>{sub}</span>
                                            {parseLinkSub(item.link) === sub && parseLinkMain(item.link) === activeMain && (
                                              <svg className="w-3.5 h-3.5 text-[#1A2B4A] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </button>
                                        ))}
                                        {activeSubs.length === 0 && (
                                          <p className="text-xs text-gray-400 px-4 py-4">소분류가 없습니다.</p>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5 font-mono">→ {item.link}</p>
                          </div>

                          {/* 아이콘 이미지 */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-2">아이콘 이미지</label>
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl overflow-hidden"
                                style={{ backgroundColor: item.bg_color }}>
                                {item.icon_url && !item.icon_url.startsWith("data:")
                                  ? <img src={item.icon_url} alt="" className="w-9 h-9 object-contain" />
                                  : <span className="leading-none select-none">{item.emoji}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <input ref={el => { fileInputRefs.current[item.id] = el; }}
                                  type="file" accept="image/*" className="hidden"
                                  onChange={e => { const file = e.target.files?.[0]; if (file) handleIconFile(item.id, file); e.target.value = ""; }} />
                                <div className="flex items-center gap-2 mb-1.5">
                                  <button onClick={() => fileInputRefs.current[item.id]?.click()}
                                    disabled={uploadingId === item.id}
                                    className="px-3 py-1.5 bg-[#1A2B4A] text-white text-xs rounded-lg hover:bg-[#243d6a] disabled:opacity-50">
                                    {uploadingId === item.id ? "업로드 중..." : "이미지 업로드"}
                                  </button>
                                  {item.icon_url && (
                                    <button onClick={() => updateItem(item.id, { icon_url: "" })}
                                      className="px-2.5 py-1.5 border border-red-200 text-red-500 text-xs rounded-lg hover:bg-red-50">
                                      제거
                                    </button>
                                  )}
                                </div>
                                {uploadErr[item.id] && <p className="text-[11px] text-red-500 mb-1">{uploadErr[item.id]}</p>}
                                <p className="text-[11px] text-gray-400">권장: 200×200px · PNG · 500KB 이하</p>
                              </div>
                            </div>
                          </div>

                          {/* 배경색 */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">배경색</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={item.bg_color}
                                onChange={e => updateItem(item.id, { bg_color: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                              <input type="text" value={item.bg_color}
                                onChange={e => updateItem(item.id, { bg_color: e.target.value })}
                                className="flex-1 text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30" />
                              <button onClick={() => updateItem(item.id, { bg_color: "#f0f0f0" })}
                                className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 whitespace-nowrap">초기화</button>
                            </div>
                          </div>

                          {/* 새탭 / 노출 */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">링크 설정</label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={item.open_in_new_tab}
                                  onChange={e => updateItem(item.id, { open_in_new_tab: e.target.checked })}
                                  className="w-4 h-4 accent-[#1A2B4A]" />
                                <span className="text-sm text-gray-700">새 탭에서 열기</span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">노출 여부</label>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateItem(item.id, { is_visible: !item.is_visible })}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_visible ? "bg-[#1A2B4A]" : "bg-gray-300"}`}>
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.is_visible ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                                <span className="text-sm text-gray-600">{item.is_visible ? "노출됨" : "숨겨짐"}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#ff550c] hover:text-[#ff550c] transition-colors">
            + 카테고리 추가
          </button>

          {qcDbError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ Supabase 설정 필요</p>
              <pre className="text-xs bg-amber-100 rounded-lg p-3 text-amber-900 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS site_settings (
  section TEXT PRIMARY KEY,
  config  JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);`}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
