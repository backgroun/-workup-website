"use client";
import { useState } from "react";
import type { Brand } from "@/data/brands";
import { BRANDS } from "@/lib/brands-data";
import { brandSlug } from "@/lib/brandCatalog-server";
import CatalogEditor from "@/components/admin/CatalogEditor";

export default function AssembledCatalogTab({
  brand, brandId, onPatchBrand, flash, pageCount,
}: {
  brand: Brand;
  brandId: string | number;
  onPatchBrand: (patch: Partial<Brand>) => void;
  flash?: (t: string, type?: string) => void;
  pageCount?: number;
}) {
  const editorKey = String(brandId);
  const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  const publicSlug =
    BRANDS.find((b) => norm(b.name) === norm(brand.name))?.id || brandSlug(brand.name);

  const [savingToggle, setSavingToggle] = useState(false);

  const toggleEnabled = async (next: boolean) => {
    onPatchBrand({ catalog_enabled: next });
    setSavingToggle(true);
    try {
      const res = await fetch(`/api/admin/brands/${editorKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog_enabled: next }),
      });
      if (!res.ok) throw new Error();
      flash?.(next ? "카탈로그를 공개했습니다." : "카탈로그를 비공개로 전환했습니다.");
    } catch {
      onPatchBrand({ catalog_enabled: !next });
      flash?.("공개 상태 저장에 실패했습니다.", "err");
    }
    setSavingToggle(false);
  };

  return (
    <div className="space-y-5 text-sm">
      {/* 공개 토글 + 안내 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled={savingToggle}
            checked={brand.catalog_enabled === true}
            onChange={(e) => toggleEnabled(e.target.checked)} />
          <span className="font-semibold">이 브랜드의 카탈로그 공개</span>
          {savingToggle && <span className="text-xs text-slate-400">저장 중…</span>}
        </label>
        <p className="text-xs text-gray-500">
          카탈로그는 <b>페이지(표지·목차·구분·이미지·분할)</b> 단위로 구성합니다. 아래 편집기에서 페이지를 추가/정렬하면{" "}
          <code>/brands/{publicSlug}/catalog</code> 플립북에 노출됩니다.
          {typeof pageCount === "number" && <> 현재 <b>{pageCount}</b>페이지.</>}
        </p>
        <p className="text-xs text-emerald-600">공개 토글은 켜는 즉시 저장됩니다.</p>
      </div>

      {/* 인라인 카탈로그 편집기 */}
      <div className="border-t border-slate-100 pt-5">
        <CatalogEditor brandId={editorKey} />
      </div>
    </div>
  );
}
