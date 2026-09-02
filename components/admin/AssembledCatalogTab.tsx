"use client";
import { useState } from "react";
import Link from "next/link";
import type { Brand } from "@/data/brands";
import { BRANDS } from "@/lib/brands-data";
import { brandSlug } from "@/lib/brandCatalog-server";

export default function AssembledCatalogTab({
  brand, brandId, onPatchBrand, flash, pageCount,
}: {
  brand: Brand;
  brandId: string | number; // = editing.id (DB brands.id) — catalog_pages.brand_id 저장/조회 키
  onPatchBrand: (patch: Partial<Brand>) => void;
  flash?: (t: string, type?: string) => void;
  pageCount?: number;
}) {
  const editorKey = String(brandId);
  const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  const publicSlug =
    BRANDS.find((b) => norm(b.name) === norm(brand.name))?.id || brandSlug(brand.name);

  const [savingToggle, setSavingToggle] = useState(false);

  // 공개 토글은 즉시 저장한다 (상단 저장 버튼을 안 눌러도 반영되도록)
  const toggleEnabled = async (next: boolean) => {
    onPatchBrand({ catalog_enabled: next }); // 편집 상태 동기화
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
      onPatchBrand({ catalog_enabled: !next }); // 롤백
      flash?.("공개 상태 저장에 실패했습니다.", "err");
    }
    setSavingToggle(false);
  };

  return (
    <div className="space-y-5 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" disabled={savingToggle}
          checked={brand.catalog_enabled === true}
          onChange={(e) => toggleEnabled(e.target.checked)} />
        <span className="font-semibold">이 브랜드의 카탈로그 공개</span>
        {savingToggle && <span className="text-xs text-slate-400">저장 중…</span>}
      </label>
      <p className="text-xs text-gray-500">
        카탈로그는 <b>페이지(표지·목차·구분·이미지·분할)</b> 단위로 구성합니다.
        아래 편집기에서 페이지를 추가/정렬하면 <code>/brands/{publicSlug}/catalog</code> 플립북에 노출됩니다.
        {typeof pageCount === "number" && <> 현재 <b>{pageCount}</b>페이지.</>}
      </p>
      <p className="text-xs text-emerald-600">공개 토글은 켜는 즉시 저장됩니다.</p>
      <Link href={`/admin/catalog?brand=${encodeURIComponent(editorKey)}`}
        className="inline-block px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
        이 브랜드 카탈로그 페이지 편집 →
      </Link>
    </div>
  );
}
