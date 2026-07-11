"use client";
import { useState, useEffect, useCallback } from "react";
import AdminImageField from "@/components/admin/AdminImageField";
import { DEFAULT_PRODUCT_BANNERS, normalizeProductBanners, type ProductBannersConfig } from "@/lib/product-banners";

const SECTION = "product_detail_banners";

export default function AdminProductBannersPage() {
  const [cfg, setCfg] = useState<ProductBannersConfig>(DEFAULT_PRODUCT_BANNERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [dbMissing, setDbMissing] = useState(false);

  const flash = (text: string, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/site-settings/${SECTION}`);
      if (!res.ok) { setDbMissing(true); setLoading(false); return; }
      const data = await res.json();
      setCfg(normalizeProductBanners(data));
    } catch {
      setDbMissing(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setBanner = (idx: number, key: "imageUrl" | "link", value: string) => {
    setCfg((prev) => ({
      banners: prev.banners.map((b, i) => (i === idx ? { ...b, [key]: value } : b)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/site-settings/${SECTION}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSaving(false);
    if (res.ok) flash("저장됐습니다.");
    else {
      const err = await res.json().catch(() => ({}));
      flash(err.error ?? "저장 실패", "err");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
        <span className="w-4 h-4 border-2 border-[#E5541B] border-t-transparent rounded-full animate-spin" />
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">상세 배너 관리</h1>
        <p className="text-sm text-gray-400 mt-1">상품 상세페이지 &quot;가까운 매장 찾기&quot; 하단에 노출되는 배너 2개입니다.</p>
      </div>

      {dbMissing && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          사이트 설정 테이블이 아직 없습니다. Supabase 설정 후 다시 시도하세요.
        </div>
      )}

      {msg.text && (
        <div className={`px-4 py-3 rounded-lg text-sm ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {cfg.banners.map((b, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-bold text-[#303236]">배너 {idx + 1}</p>
            <AdminImageField
              label="배너 이미지"
              value={b.imageUrl}
              onChange={(url) => setBanner(idx, "imageUrl", url)}
              promptType="product"
              promptSeed={`상품 상세 하단 배너 ${idx + 1}`}
              recommendedSize="가로형 배너"
              showPrompt={false}
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">연결 링크 (선택)</label>
              <input value={b.link} onChange={(e) => setBanner(idx, "link", e.target.value)}
                placeholder="예: /story 또는 https://..."
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#303236] rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-8 py-2.5 bg-[#E5541B] text-white text-sm font-semibold hover:bg-[#e04500] disabled:opacity-50 rounded">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <p className="text-xs text-gray-400">* 이미지를 비우면 해당 배너는 상세페이지에 표시되지 않습니다. 링크가 없으면 클릭해도 이동하지 않습니다.</p>
    </div>
  );
}
