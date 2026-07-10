"use client";
import { useState, useEffect } from "react";
import {
  DEFAULT_PRODUCT_FILTERS,
  normalizeProductFilters,
  type ProductFiltersConfig,
  type PriceRange,
} from "@/lib/product-filters";

// 전체상품 페이지 상단 필터(사이즈·가격 구간) 관리 팝업.
export default function FilterManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cfg, setCfg] = useState<ProductFiltersConfig>(DEFAULT_PRODUCT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [sizeInput, setSizeInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/site-settings/product_filters")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCfg(d ? normalizeProductFilters(d) : { ...DEFAULT_PRODUCT_FILTERS }))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2000); };

  const addSize = () => {
    const s = sizeInput.trim();
    setSizeInput("");
    if (!s || cfg.sizes.includes(s)) return;
    setCfg((c) => ({ ...c, sizes: [...c.sizes, s] }));
  };
  const removeSize = (i: number) => setCfg((c) => ({ ...c, sizes: c.sizes.filter((_, idx) => idx !== i) }));

  const addRange = () => setCfg((c) => ({ ...c, priceRanges: [...c.priceRanges, { label: "", min: 0, max: null }] }));
  const setRange = (i: number, patch: Partial<PriceRange>) =>
    setCfg((c) => ({ ...c, priceRanges: c.priceRanges.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const removeRange = (i: number) => setCfg((c) => ({ ...c, priceRanges: c.priceRanges.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      const clean = normalizeProductFilters({
        sizes: cfg.sizes.map((s) => s.trim()).filter(Boolean),
        priceRanges: cfg.priceRanges.filter((r) => r.label.trim()),
      });
      const r = await fetch("/api/admin/site-settings/product_filters", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clean),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "border border-gray-200 px-2.5 py-1.5 text-sm rounded focus:outline-none focus:border-[#303236]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#303236]">필터 관리</h2>
            <p className="text-xs text-gray-400 mt-0.5">전체상품 페이지 상단 필터(사이즈·가격)를 조정합니다.</p>
          </div>
          <div className="flex items-center gap-3">
            {toast && <span className="text-sm text-green-600 font-medium">{toast}</span>}
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "저장 중..." : "저장"}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-7">
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">불러오는 중...</p>
          ) : (
            <>
              {/* 사이즈 */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">사이즈 옵션</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cfg.sizes.length === 0 && <span className="text-xs text-gray-400">사이즈가 없습니다.</span>}
                  {cfg.sizes.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded px-2.5 py-1 text-sm">
                      {s}
                      <button type="button" onClick={() => removeSize(i)} className="text-gray-400 hover:text-red-500 leading-none">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
                    placeholder="사이즈 추가 (예: 4XL)" className={`w-44 ${inputCls}`} />
                  <button type="button" onClick={addSize} disabled={!sizeInput.trim()}
                    className="px-3 py-1.5 text-sm border border-[#303236] text-[#303236] hover:bg-[#303236] hover:text-white rounded transition-colors disabled:opacity-40">+ 추가</button>
                </div>
              </div>

              {/* 가격 구간 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">가격 구간</p>
                  <button type="button" onClick={addRange}
                    className="text-xs font-semibold text-[#303236] border border-[#303236] rounded px-2.5 py-1 hover:bg-[#303236] hover:text-white transition-colors">+ 구간 추가</button>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">최소·최대 금액(원). <b>최대를 비우면 &quot;이상&quot;</b>으로 처리됩니다. (예: 최소 80000, 최대 비움 → 8만원 이상)</p>
                {cfg.priceRanges.length === 0 ? (
                  <p className="text-xs text-gray-400">등록된 구간이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {cfg.priceRanges.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={r.label} onChange={(e) => setRange(i, { label: e.target.value })}
                          placeholder="라벨 (예: 3만원 이하)" className={`flex-1 ${inputCls}`} />
                        <input type="number" value={r.min} onChange={(e) => setRange(i, { min: Number(e.target.value) || 0 })}
                          placeholder="최소" className={`w-24 ${inputCls}`} />
                        <span className="text-gray-300">~</span>
                        <input type="number" value={r.max ?? ""} onChange={(e) => setRange(i, { max: e.target.value === "" ? null : (Number(e.target.value) || 0) })}
                          placeholder="최대(비우면 이상)" className={`w-32 ${inputCls}`} />
                        <button type="button" onClick={() => removeRange(i)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 border border-gray-200 rounded flex-shrink-0">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-gray-400">저장 후 전체상품 페이지에서 <b>Ctrl+Shift+R</b>로 새로고침하면 반영됩니다.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
