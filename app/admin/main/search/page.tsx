"use client";
import { useState, useEffect } from "react";
import { DEFAULT_SEARCH, normalizeSearch, type SearchConfig } from "@/lib/header-search";

export default function SearchManagePage() {
  const [cfg, setCfg] = useState<SearchConfig>(DEFAULT_SEARCH);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newTerm, setNewTerm] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/search")
      .then((r) => r.json())
      .then((data) => setCfg(normalizeSearch(data)))
      .catch(() => setCfg(DEFAULT_SEARCH))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const set = <K extends keyof SearchConfig>(k: K, v: SearchConfig[K]) => setCfg((p) => ({ ...p, [k]: v }));

  const addTerm = () => {
    const t = newTerm.trim();
    if (!t) return;
    setCfg((p) => ({ ...p, popularTerms: [...p.popularTerms, t] }));
    setNewTerm("");
  };
  const removeTerm = (i: number) =>
    setCfg((p) => ({ ...p, popularTerms: p.popularTerms.filter((_, idx) => idx !== i) }));
  const moveTerm = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.popularTerms.length) return p;
      const next = [...p.popularTerms];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, popularTerms: next };
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

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">검색 관리</h1>
          <p className="mt-1 text-sm text-gray-500">헤더 검색의 노출 여부·입력창 안내문구·인기 검색어를 관리합니다.</p>
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
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <span className="text-[14px] text-gray-400">{cfg.placeholder || "(안내문구)"}</span>
            </div>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {cfg.popularTerms.slice(0, 4).map((t) => (
                <span key={t} className="text-[11px] text-gray-600 bg-gray-100 px-2.5 py-1">{t}</span>
              ))}
              {cfg.popularTerms.length === 0 && <span className="text-[11px] text-gray-300">인기 검색어 없음</span>}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">사이트에서는 인기 검색어 중 4개가 순환 노출됩니다.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* 기본 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">기본 설정</p>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium text-gray-700">헤더 검색 표시</span>
            <span className="text-xs text-gray-400">끄면 헤더의 검색 아이콘이 사라집니다.</span>
          </label>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">입력창 안내문구 (placeholder)</label>
            <input type="text" value={cfg.placeholder} onChange={(e) => set("placeholder", e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        {/* 인기 검색어 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">인기 검색어 ({cfg.popularTerms.length})</p>

          <div className="flex items-center gap-2">
            <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTerm(); }}
              placeholder="검색어 입력 후 Enter"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            <button onClick={addTerm}
              className="px-3.5 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0">추가</button>
          </div>

          {cfg.popularTerms.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">인기 검색어가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {cfg.popularTerms.map((t, i) => (
                <div key={`${t}-${i}`} className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50">
                  <span className="text-[11px] font-semibold text-slate-400 w-5">#{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700">{t}</span>
                  <button onClick={() => moveTerm(i, -1)} disabled={i === 0} title="위로"
                    className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">↑</button>
                  <button onClick={() => moveTerm(i, 1)} disabled={i === cfg.popularTerms.length - 1} title="아래로"
                    className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">↓</button>
                  <button onClick={() => removeTerm(i)} title="삭제"
                    className="w-6 h-6 flex items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
