"use client";
import { useState, useEffect } from "react";
import { DEFAULT_WISHLIST, normalizeWishlist, type WishlistConfig } from "@/lib/wishlist";

// 단일 텍스트/텍스트영역 입력
function Field({ label, value, onChange, textarea, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-y" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      )}
    </div>
  );
}

// 버튼 문구 + 링크 한 쌍
function CtaPair({ label, text, href, onText, onHref }: {
  label: string; text: string; href: string; onText: (v: string) => void; onHref: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1.5">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={text} onChange={(e) => onText(e.target.value)} placeholder="버튼 문구"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <input type="text" value={href} onChange={(e) => onHref(e.target.value)} placeholder="/store"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
      </div>
    </div>
  );
}

export default function WishlistManagePage() {
  const [cfg, setCfg] = useState<WishlistConfig>(DEFAULT_WISHLIST);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/wishlist")
      .then((r) => r.json())
      .then((data) => setCfg(normalizeWishlist(data)))
      .catch(() => setCfg(DEFAULT_WISHLIST))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const set = <K extends keyof WishlistConfig>(k: K, v: WishlistConfig[K]) => setCfg((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/wishlist", {
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
          <h1 className="text-3xl font-bold text-gray-900">피킹리스트(찜 목록) 관리</h1>
          <p className="mt-1 text-sm text-gray-500">고객이 보는 찜(피팅 리스트) 페이지의 안내 문구·빈 상태·매장 방문 유도 버튼을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={() => setCfg(DEFAULT_WISHLIST)}
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            기본값
          </button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start max-w-5xl">
        {/* 상단 히어로 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">상단 히어로</p>
          <Field label="작은 영문 라벨" value={cfg.heroEyebrow} onChange={(v) => set("heroEyebrow", v)} placeholder="FITTING LIST" />
          <Field label="제목" value={cfg.heroTitle} onChange={(v) => set("heroTitle", v)} placeholder="피팅 리스트" />
          <Field label="설명" value={cfg.heroDesc} onChange={(v) => set("heroDesc", v)} textarea placeholder="매장 방문 시 이 목록을 직원에게 보여주세요." />
        </div>

        {/* 빈 상태 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">담은 제품이 없을 때</p>
          <Field label="제목" value={cfg.emptyTitle} onChange={(v) => set("emptyTitle", v)} placeholder="담은 제품이 없습니다." />
          <Field label="설명" value={cfg.emptyDesc} onChange={(v) => set("emptyDesc", v)} textarea placeholder="마음에 드는 제품을 골라 피팅 리스트에 담아보세요." />
          <CtaPair label="버튼 (문구 · 링크)" text={cfg.emptyCtaLabel} href={cfg.emptyCtaHref}
            onText={(v) => set("emptyCtaLabel", v)} onHref={(v) => set("emptyCtaHref", v)} />
        </div>

        {/* 매장 방문 안내 배너 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">매장 방문 안내 배너</p>
          <Field label="제목" value={cfg.noticeTitle} onChange={(v) => set("noticeTitle", v)} placeholder="매장 방문 안내" />
          <Field label="설명" value={cfg.noticeDesc} onChange={(v) => set("noticeDesc", v)} textarea placeholder="아래 목록을 매장 직원에게 보여주시면..." />
          <CtaPair label="버튼 (문구 · 링크)" text={cfg.noticeCtaLabel} href={cfg.noticeCtaHref}
            onText={(v) => set("noticeCtaLabel", v)} onHref={(v) => set("noticeCtaHref", v)} />
        </div>

        {/* 하단 액션 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">하단 액션 버튼</p>
          <CtaPair label="주 버튼 (문구 · 링크)" text={cfg.primaryLabel} href={cfg.primaryHref}
            onText={(v) => set("primaryLabel", v)} onHref={(v) => set("primaryHref", v)} />
          <CtaPair label="보조 버튼 (문구 · 링크)" text={cfg.secondaryLabel} href={cfg.secondaryHref}
            onText={(v) => set("secondaryLabel", v)} onHref={(v) => set("secondaryHref", v)} />
          <p className="text-[11px] text-gray-400 leading-relaxed">
            매장 방문·길찾기로 연결되는 버튼은 오프라인 방문 전환의 핵심입니다. 링크는 <span className="font-mono">/store</span> 처럼 내부 경로로 입력하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
