"use client";
import { useEffect, useState } from "react";
import {
  DEFAULT_INSTAGRAM_FEED,
  normalizeInstagramFeed,
  normalizeAccount,
  type InstagramFeedConfig,
} from "@/lib/instagram-feed";

// 인스타 피드 "공통 표시 설정" 관리.
// 실제 게시물은 각 상품 등록/수정 화면의 "인스타 피드" 섹션에서 상품별로 등록한다.
export default function InstagramFeedAdminPage() {
  const [cfg, setCfg] = useState<InstagramFeedConfig>({ ...DEFAULT_INSTAGRAM_FEED });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/instagram_feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCfg(normalizeInstagramFeed(d)); })
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const set = <K extends keyof InstagramFeedConfig>(key: K, val: InstagramFeedConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      // 게시물은 상품별로 관리하므로 공통 설정만 저장 (posts는 유지)
      const r = await fetch("/api/admin/site-settings/instagram_feed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const acct = normalizeAccount(cfg.account);

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">인스타 피드 설정</h1>
          <p className="mt-1 text-sm text-gray-500">상품 상세페이지 하단 인스타 섹션의 <b>공통 표시 설정</b>입니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-5">
        <p className="text-sm text-blue-900 leading-relaxed">
          <b>게시물은 여기서 등록하지 않습니다.</b> 각 상품의 <b>등록/수정 화면 → &quot;인스타 피드&quot; 섹션</b>에서
          그 상품과 관련된 게시물 URL을 등록하면, 해당 상품 상세페이지 하단에만 노출됩니다.
          이 페이지는 모든 상품에 공통 적용되는 <b>제목·부제·계정·열 수</b>만 설정합니다.
        </p>
      </div>

      {/* 기본 설정 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">공통 표시 설정</p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={cfg.is_visible}
              onChange={(e) => set("is_visible", e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium text-gray-700">섹션 노출 (전체 마스터)</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">섹션 제목</label>
            <input value={cfg.title} onChange={(e) => set("title", e.target.value)}
              placeholder="인스타그램 속 WORKUP"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">부제 (선택)</label>
            <input value={cfg.subtitle} onChange={(e) => set("subtitle", e.target.value)}
              placeholder="실제 현장에서 만나는 워크업"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">인스타 계정 (선택, 팔로우 버튼)</label>
            <input value={cfg.account} onChange={(e) => set("account", e.target.value)}
              placeholder="@workup_official 또는 프로필 URL"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            {acct && <p className="text-[11px] text-gray-400 mt-1">→ {acct.url}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">데스크탑 열 수</label>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
              {([3, 4] as const).map((n) => (
                <button key={n} type="button" onClick={() => set("columns_desktop", n)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    cfg.columns_desktop === n ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {n}열
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">모바일은 항상 2열입니다.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
        <a href="/admin/products" target="_blank" rel="noopener"
          className="text-sm text-gray-400 hover:text-[#1A2B4A] transition-colors">상품에서 게시물 등록하기 ↗</a>
      </div>
    </div>
  );
}
