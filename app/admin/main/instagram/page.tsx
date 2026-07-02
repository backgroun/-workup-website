"use client";
import { useEffect, useState, useCallback } from "react";
import {
  DEFAULT_INSTAGRAM_FEED,
  normalizeInstagramFeed,
  normalizeAccount,
  type InstagramFeedConfig,
} from "@/lib/instagram-feed";
import type { Product } from "@/data/products";

type PostEntry = { productId: string; productName: string; idx: number; image: string; url: string };

// 인스타 피드 "공통 표시 설정" + "등록 게시물 점검·정리".
// 게시물 자체는 각 상품 등록/수정 화면에서 상품별로 등록하지만,
// 링크가 죽은(비공개·삭제) 게시물을 여기서 모아 점검하고 정리할 수 있다.
export default function InstagramFeedAdminPage() {
  const [cfg, setCfg] = useState<InstagramFeedConfig>({ ...DEFAULT_INSTAGRAM_FEED });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings/instagram_feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCfg(normalizeInstagramFeed(d)); })
      .finally(() => setLoading(false));
  }, []);

  const loadProducts = useCallback(() => {
    setProdLoading(true);
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setProdLoading(false));
  }, []);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const set = <K extends keyof InstagramFeedConfig>(key: K, val: InstagramFeedConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
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

  // 링크(url)가 등록된 게시물만 모은다 — 죽을 수 있는 건 링크뿐(이미지는 서버 저장).
  const entries: PostEntry[] = products.flatMap((prod) =>
    (prod.instagramPosts ?? [])
      .map((post, idx) => ({ productId: prod.id, productName: prod.name, idx, image: post.image, url: (post.url ?? "").trim() }))
      .filter((e) => e.url !== "")
  );

  // 상품에서 특정 게시물 제거 → 해당 상품 전체 PUT
  const removePost = async (productId: string, idx: number) => {
    if (!confirm("이 게시물을 해당 상품에서 삭제할까요? (되돌릴 수 없습니다)")) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const nextPosts = (prod.instagramPosts ?? []).filter((_, i) => i !== idx);
    const updated = { ...prod, instagramPosts: nextPosts };
    const key = `${productId}:${idx}`;
    setBusyKey(key);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setProducts((list) => list.map((p) => (p.id === productId ? updated : p)));
        flash("삭제됐습니다.");
      } else {
        const e = await res.json().catch(() => ({}));
        flash(`삭제 실패: ${e.error ?? res.status}`);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const acct = normalizeAccount(cfg.account);

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">인스타 피드 관리</h1>
          <p className="mt-1 text-sm text-gray-500">공통 표시 설정 + 등록 게시물 점검·정리.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "저장 중..." : "설정 저장"}
          </button>
        </div>
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
              placeholder="WORKUP on Instagram"
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

      {/* 등록 게시물 점검 · 정리 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-5">
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">등록 게시물 점검 · 정리 ({entries.length})</p>
          <button onClick={loadProducts} disabled={prodLoading}
            className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            {prodLoading ? "불러오는 중..." : "새로고침 ⟳"}
          </button>
        </div>
        <p className="text-[12px] text-gray-400 mb-4 leading-relaxed">
          인스타 <b>링크가 등록된 게시물</b> 목록입니다. <b>링크 열기</b>로 열어보고, <b>비공개·삭제된 게시물</b>은 <b className="text-red-500">삭제</b>로 정리하세요.
          <br />※ 업로드한 이미지 자체는 서버에 저장돼 있어 사라지지 않지만, 클릭 시 이동하는 <b>인스타 링크</b>는 죽습니다.
        </p>

        {prodLoading ? (
          <p className="text-sm text-gray-400 py-8 text-center">불러오는 중...</p>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
            링크가 등록된 게시물이 없습니다. (상품 등록 화면의 &quot;인스타 피드&quot;에서 인스타 링크를 함께 넣은 게시물만 여기 표시됩니다)
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
            {entries.map((e) => {
              const key = `${e.productId}:${e.idx}`;
              return (
                <div key={key} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                  {e.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image} alt="" className="w-9 h-11 object-cover rounded flex-shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-9 h-11 rounded flex-shrink-0 bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B4A] truncate">{e.productName}</p>
                    <p className="text-[11px] text-gray-400 font-mono truncate" title={e.url}>{e.url}</p>
                  </div>
                  <a href={e.url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline whitespace-nowrap shrink-0">링크 열기 ↗</a>
                  <a href={`/admin/products/${e.productId}/edit`} target="_blank" rel="noopener"
                    className="text-[11px] text-gray-500 hover:underline whitespace-nowrap shrink-0 hidden sm:inline">상품 편집 ↗</a>
                  <button onClick={() => removePost(e.productId, e.idx)} disabled={busyKey === key}
                    className="text-[11px] font-medium text-red-500 border border-red-200 px-2.5 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0">
                    {busyKey === key ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <a href="/admin/products" target="_blank" rel="noopener"
          className="text-sm text-gray-400 hover:text-[#1A2B4A] transition-colors">상품에서 게시물 등록하기 ↗</a>
      </div>
    </div>
  );
}
