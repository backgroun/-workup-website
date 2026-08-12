"use client";
import { useState, useEffect } from "react";
import { DEFAULT_SEARCH, normalizeSearch, type SearchConfig, type SearchRotationSource } from "@/lib/header-search";

type PhraseField = "displayPhrases" | "popularTerms";

// 프로모션 문구·검색 키워드 두 목록이 추가/삭제/순서변경 UI를 그대로 공유한다.
function PhraseListCard({
  title, hint, active, items, newValue, onNewValueChange, onAdd, onRemove, onMove,
}: {
  title: string;
  hint: string;
  active: boolean;
  items: string[];
  newValue: string;
  onNewValueChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 space-y-4 ${active ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title} ({items.length})</p>
          {active && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">현재 사용 중</span>}
        </div>
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="text" value={newValue} onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
          placeholder="문구 입력 후 Enter"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={onAdd}
          className="px-3.5 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0">추가</button>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">등록된 문구가 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {items.map((t, i) => (
            <div key={`${t}-${i}`} className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400 w-5">#{i + 1}</span>
              <span className="flex-1 text-sm text-gray-700">{t}</span>
              <button onClick={() => onMove(i, -1)} disabled={i === 0} title="위로"
                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">↑</button>
              <button onClick={() => onMove(i, 1)} disabled={i === items.length - 1} title="아래로"
                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">↓</button>
              <button onClick={() => onRemove(i)} title="삭제"
                className="w-6 h-6 flex items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchManagePage() {
  const [cfg, setCfg] = useState<SearchConfig>(DEFAULT_SEARCH);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newDisplayPhrase, setNewDisplayPhrase] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/search")
      .then((r) => r.json())
      .then((data) => setCfg(normalizeSearch(data)))
      .catch(() => setCfg(DEFAULT_SEARCH))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const set = <K extends keyof SearchConfig>(k: K, v: SearchConfig[K]) => setCfg((p) => ({ ...p, [k]: v }));

  const addPhrase = (field: PhraseField, value: string) => {
    const t = value.trim();
    if (!t) return;
    setCfg((p) => ({ ...p, [field]: [...p[field], t] }));
  };
  const removePhrase = (field: PhraseField, i: number) =>
    setCfg((p) => ({ ...p, [field]: p[field].filter((_, idx) => idx !== i) }));
  const movePhrase = (field: PhraseField, i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const list = p[field];
      const j = i + dir;
      if (j < 0 || j >= list.length) return p;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, [field]: next };
    });

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/search", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg),
      });
      flash(r.ok ? "저장됐습니다. 사이트에 바로 반영됩니다." : "저장에 실패했습니다.");
    } catch { flash("저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  const activeList = cfg.rotationSource === "display" ? cfg.displayPhrases : cfg.popularTerms;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">검색 관리</h1>
          <p className="mt-1 text-sm text-gray-500">헤더 검색의 노출 여부·입력창에 순환 노출될 안내 문구를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={() => setCfg(DEFAULT_SEARCH)}
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            기본값
          </button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">검색 패널 미리보기</p>
          {!cfg.enabled && <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">검색 꺼짐 — 헤더에서 검색 아이콘이 숨겨집니다</span>}
        </div>
        <div className={cfg.enabled ? "" : "opacity-40"}>
          <div className="border border-gray-100 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-gray-400">
                {activeList[0] || cfg.placeholder || "(안내문구)"}
              </span>
            </div>
          </div>
          {activeList.length > 0 ? (
            <p className="text-[11px] text-gray-400 mt-1.5">
              {cfg.rotationSource === "display" ? "프로모션 문구" : "검색 키워드"} 목록의 {activeList.length}개 문구가 3초 간격으로 순서대로 바뀌며 노출됩니다.
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">선택된 목록({cfg.rotationSource === "display" ? "프로모션 문구" : "검색 키워드"})이 비어있어 고정 안내문구만 노출됩니다.</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* 기본 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 lg:col-span-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">기본 설정</p>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium text-gray-700">헤더 검색 표시</span>
            <span className="text-xs text-gray-400">끄면 헤더의 검색 아이콘이 사라집니다.</span>
          </label>

          <div>
            <label className="text-xs text-gray-500 block mb-1.5">검색창에 순환 노출할 목록</label>
            <div className="flex gap-2">
              {([
                ["keywords", "검색 키워드 순환"],
                ["display", "프로모션 문구 순환"],
              ] as [SearchRotationSource, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => set("rotationSource", value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    cfg.rotationSource === value
                      ? "bg-slate-800 text-white border-slate-800"
                      : "border-gray-200 text-gray-600 hover:border-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">두 목록 모두 아래에서 계속 관리할 수 있고, 실제 사이트에는 선택된 목록만 노출됩니다.</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1.5">입력창 고정 안내문구 (placeholder)</label>
            <input type="text" value={cfg.placeholder} onChange={(e) => set("placeholder", e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            <p className="text-xs text-gray-400 mt-1.5">선택된 목록이 비어있을 때만 노출되는 최종 대체 문구입니다.</p>
          </div>
        </div>

        <PhraseListCard
          title="검색 키워드 목록"
          hint="상품 검색어 위주의 짧은 키워드 (예: 안전조끼, 방풍 자켓)."
          active={cfg.rotationSource === "keywords"}
          items={cfg.popularTerms}
          newValue={newKeyword}
          onNewValueChange={setNewKeyword}
          onAdd={() => { addPhrase("popularTerms", newKeyword); setNewKeyword(""); }}
          onRemove={(i) => removePhrase("popularTerms", i)}
          onMove={(i, dir) => movePhrase("popularTerms", i, dir)}
        />

        <PhraseListCard
          title="프로모션 문구 목록"
          hint="브랜드·이벤트 홍보성 문장 (예: 이번주 신상품을 만나보세요)."
          active={cfg.rotationSource === "display"}
          items={cfg.displayPhrases}
          newValue={newDisplayPhrase}
          onNewValueChange={setNewDisplayPhrase}
          onAdd={() => { addPhrase("displayPhrases", newDisplayPhrase); setNewDisplayPhrase(""); }}
          onRemove={(i) => removePhrase("displayPhrases", i)}
          onMove={(i, dir) => movePhrase("displayPhrases", i, dir)}
        />
      </div>
    </div>
  );
}
