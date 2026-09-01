"use client";
import Link from "next/link";
import type { Brand } from "@/data/brands";
import { BRANDS } from "@/lib/brands-data";
import { brandSlug } from "@/lib/brandCatalog-server";

export default function AssembledCatalogTab({
  brand, brandId, onPatchBrand, pageCount,
}: {
  brand: Brand;
  brandId: string | number; // = editing.id (DB brands.id) — catalog_pages.brand_id 저장/조회 키
  onPatchBrand: (patch: Partial<Brand>) => void;
  flash?: (t: string, type?: string) => void;
  pageCount?: number;
}) {
  // 편집기 스코프 키는 DB id (모든 읽기 경로가 String(brand.id) 로 조회하므로 반드시 일치)
  const editorKey = String(brandId);
  // 공개 URL 슬러그 (정적 브랜드는 고정 id, 아니면 slugify)
  const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  const publicSlug =
    BRANDS.find((b) => norm(b.name) === norm(brand.name))?.id || brandSlug(brand.name);

  return (
    <div className="space-y-5 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={brand.catalog_enabled === true}
          onChange={(e) => onPatchBrand({ catalog_enabled: e.target.checked })} />
        <span className="font-semibold">이 브랜드의 카탈로그 공개</span>
      </label>
      <p className="text-xs text-gray-500">
        카탈로그는 <b>페이지(표지·목차·구분·이미지·분할)</b> 단위로 구성합니다.
        아래 편집기에서 페이지를 추가/정렬하면 <code>/brands/{publicSlug}/catalog</code> 플립북에 노출됩니다.
        {typeof pageCount === "number" && <> 현재 <b>{pageCount}</b>페이지.</>}
      </p>
      <p className="text-xs text-amber-600">공개 토글은 이 화면 상단 <b>저장 버튼</b>으로 저장됩니다.</p>
      <Link href={`/admin/catalog?brand=${encodeURIComponent(editorKey)}`}
        className="inline-block px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
        이 브랜드 카탈로그 페이지 편집 →
      </Link>
    </div>
  );
}
