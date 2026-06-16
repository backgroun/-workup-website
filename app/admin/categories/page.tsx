"use client";
import { useState, useEffect } from "react";

type CatItem = { name: string; subs: string[] };

const DEFAULT_CATEGORIES: CatItem[] = [
  { name: "현장",  subs: ["상의", "하의", "계절·기능", "안전용품"] },
  { name: "여성",  subs: ["여성 상의", "여성 하의", "여성 아우터"] },
  { name: "소품",  subs: ["가방", "모자", "장갑", "양말", "벨트", "기타"] },
  { name: "남성",  subs: ["남성 상의", "남성 하의", "남성 아우터", "신발"] },
  { name: "공용",  subs: ["공용 상의", "공용 하의", "공용 아우터"] },
  { name: "일상",  subs: ["데일리웨어", "아우터", "팬츠"] },
];

export default function CategoriesPage() {
  const [cats, setCats] = useState<CatItem[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"ok" | "err" | null>(null);

  // 새 대카테고리 입력
  const [newMain, setNewMain] = useState("");
  // 각 카테고리별 하위카테고리 입력값
  const [newSubInputs, setNewSubInputs] = useState<Record<number, string>>({});
  // 카테고리 이름 편집 모드
  const [editingMain, setEditingMain] = useState<number | null>(null);
  const [editMainVal, setEditMainVal] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/categories")
      .then((r) => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (data && Array.isArray((data as { categories?: unknown }).categories)) {
          setCats((data as { categories: CatItem[] }).categories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setSaveMsg(null);
    const res = await fetch("/api/admin/site-settings/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: cats }),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "ok" : "err");
    setTimeout(() => setSaveMsg(null), 2500);
  }

  function addMainCat() {
    const name = newMain.trim();
    if (!name || cats.some((c) => c.name === name)) return;
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

  function startEditMain(idx: number) {
    setEditingMain(idx);
    setEditMainVal(cats[idx].name);
  }

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
      setNewSubInputs((p) => ({ ...p, [catIdx]: "" }));
      return;
    }
    const next = [...cats];
    next[catIdx] = { ...next[catIdx], subs: [...next[catIdx].subs, val] };
    setCats(next);
    setNewSubInputs((p) => ({ ...p, [catIdx]: "" }));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-8">
      <div className="max-w-2xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#1A2B4A]">카테고리 관리</h1>
            <p className="text-sm text-gray-400 mt-1">대카테고리 · 중카테고리 2단계 구조</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className={`text-sm font-medium ${saveMsg === "ok" ? "text-green-600" : "text-red-500"}`}>
                {saveMsg === "ok" ? "저장됐습니다 ✓" : "저장 실패"}
              </span>
            )}
            <button onClick={save} disabled={saving}
              className="px-5 py-2 bg-[#1A2B4A] text-white text-sm font-semibold hover:bg-[#243d5e] disabled:opacity-50 transition-colors rounded-lg">
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="space-y-4">
          {cats.map((cat, catIdx) => (
            <div key={catIdx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* 대카테고리 헤더 */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-[#1A2B4A]/5 border-b border-gray-100">
                <div className="flex gap-1">
                  <button onClick={() => moveMain(catIdx, -1)} disabled={catIdx === 0}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs rounded border border-gray-200 bg-white">↑</button>
                  <button onClick={() => moveMain(catIdx, 1)} disabled={catIdx === cats.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs rounded border border-gray-200 bg-white">↓</button>
                </div>

                {editingMain === catIdx ? (
                  <input
                    autoFocus
                    value={editMainVal}
                    onChange={(e) => setEditMainVal(e.target.value)}
                    onBlur={() => commitEditMain(catIdx)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEditMain(catIdx); if (e.key === "Escape") setEditingMain(null); }}
                    className="flex-1 border border-[#1A2B4A] px-2 py-1 text-sm font-bold text-[#1A2B4A] focus:outline-none rounded"
                  />
                ) : (
                  <button onClick={() => startEditMain(catIdx)}
                    className="flex-1 text-left text-sm font-bold text-[#1A2B4A] hover:text-[#ff550c] transition-colors">
                    {cat.name}
                    <span className="ml-2 text-[11px] font-normal text-gray-400">클릭하여 이름 수정</span>
                  </button>
                )}

                <span className="text-[11px] text-gray-400">{cat.subs.length}개</span>
                <button onClick={() => deleteMainCat(catIdx)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  삭제
                </button>
              </div>

              {/* 하위 카테고리 */}
              <div className="p-4">
                {cat.subs.length === 0 ? (
                  <p className="text-[12px] text-gray-400 text-center py-2">
                    하위 카테고리가 없습니다. 아래에서 추가하세요.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cat.subs.map((sub, subIdx) => (
                      <div key={subIdx}
                        className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-1.5 text-sm">
                        <div className="flex gap-0.5">
                          <button onClick={() => moveSub(catIdx, subIdx, -1)} disabled={subIdx === 0}
                            className="text-[9px] text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none">◀</button>
                          <button onClick={() => moveSub(catIdx, subIdx, 1)} disabled={subIdx === cat.subs.length - 1}
                            className="text-[9px] text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none">▶</button>
                        </div>
                        <span className="text-gray-700">{sub}</span>
                        <button onClick={() => deleteSub(catIdx, subIdx)}
                          className="text-gray-300 hover:text-red-500 text-sm leading-none transition-colors">×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 하위 카테고리 추가 입력 */}
                <div className="flex gap-2">
                  <input
                    value={newSubInputs[catIdx] ?? ""}
                    onChange={(e) => setNewSubInputs((p) => ({ ...p, [catIdx]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(catIdx); } }}
                    placeholder={`"${cat.name}" 하위 카테고리 추가`}
                    className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded-lg"
                  />
                  <button type="button" onClick={() => addSub(catIdx)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors rounded-lg font-medium">
                    추가
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 대카테고리 추가 */}
        <div className="mt-6 bg-white border border-dashed border-gray-300 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 mb-3">+ 대카테고리 추가</p>
          <div className="flex gap-2">
            <input
              value={newMain}
              onChange={(e) => setNewMain(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMainCat(); } }}
              placeholder="새 대카테고리 이름 (예: 안전용품)"
              className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded-lg"
            />
            <button type="button" onClick={addMainCat}
              className="px-5 py-2 bg-[#1A2B4A] text-white text-sm font-semibold hover:bg-[#243d5e] transition-colors rounded-lg">
              추가
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          변경 후 반드시 <strong>저장</strong>을 눌러야 적용됩니다.
        </p>
      </div>
    </div>
  );
}
