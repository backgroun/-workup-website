"use client";
import { useRef, useState } from "react";
import type { Brand } from "@/data/brands";

const INPUT = "w-full border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-800";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error ?? "업로드 실패");
  return d.url as string;
}

export default function AssembledCatalogTab({
  brand,
  brandId,
  onPatchBrand,
  flash,
}: {
  brand: Brand;
  brandId: string | number;
  onPatchBrand: (patch: Partial<Brand>) => void;
  flash: (t: string, type?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const techRef = useRef<HTMLInputElement>(null);
  const techImages = brand.catalog_tech_images ?? [];

  const pickCover = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onPatchBrand({ catalog_cover_url: url });
      flash("커버 이미지 업로드 완료 · 상단 저장 버튼을 눌러 반영하세요.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "업로드 실패", "err");
    }
    setBusy(false);
  };

  const addTech = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onPatchBrand({ catalog_tech_images: [...techImages, url] });
      flash("기술서 이미지 추가 · 저장 버튼을 눌러 반영하세요.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "업로드 실패", "err");
    }
    setBusy(false);
  };

  const removeTech = (i: number) => {
    onPatchBrand({ catalog_tech_images: techImages.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={brand.catalog_enabled === true}
          onChange={(e) => onPatchBrand({ catalog_enabled: e.target.checked })}
        />
        <span className="font-semibold">이 브랜드의 조립형 카탈로그 공개</span>
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-gray-500">커버 이미지 (이미지 안에 텍스트를 넣지 마세요)</p>
          {brand.catalog_cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.catalog_cover_url} alt="" className="w-full h-40 object-cover rounded border mb-2" />
          ) : null}
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => pickCover(e.target.files?.[0])} />
          <button type="button" disabled={busy} onClick={() => coverRef.current?.click()}
            className="px-3 py-2 border rounded text-xs">커버 업로드</button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="mb-1 text-gray-500">시즌</p>
            <input className={INPUT} value={brand.catalog_season ?? ""} placeholder="2026 Spring / Summer"
              onChange={(e) => onPatchBrand({ catalog_season: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-gray-500">헤드라인 (비우면 브랜드명)</p>
            <input className={INPUT} value={brand.catalog_headline ?? ""}
              onChange={(e) => onPatchBrand({ catalog_headline: e.target.value })} />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1 text-gray-500">인트로 (커버 하단 · meta description)</p>
        <textarea className={INPUT} rows={3} value={brand.catalog_intro ?? ""}
          onChange={(e) => onPatchBrand({ catalog_intro: e.target.value })} />
      </div>

      <div>
        <p className="mb-2 text-gray-500">공용 기술서 이미지 (카탈로그 맨 끝 · 이미지 안에 텍스트를 넣지 마세요)</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {techImages.map((t, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t} alt="" className="w-20 h-20 object-cover rounded border" />
              <button type="button" onClick={() => removeTech(i)}
                className="absolute -top-2 -right-2 bg-white border rounded-full w-5 h-5 text-xs">×</button>
            </div>
          ))}
        </div>
        <input ref={techRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => addTech(e.target.files?.[0])} />
        <button type="button" disabled={busy} onClick={() => techRef.current?.click()}
          className="px-3 py-2 border rounded text-xs">기술서 이미지 추가</button>
      </div>

      <p className="text-xs text-amber-600">
        메타 항목(공개·커버·시즌·헤드라인·인트로·공용 기술서)은 이 화면의 <b>상단 저장 버튼</b>으로 저장됩니다.
        제품 항목은 아래에서 개별 저장됩니다.
      </p>

      {/* 제품 항목 편집기 — Task 9~10에서 추가 */}
      <ItemsEditorPlaceholder brandId={String(brandId)} />
    </div>
  );
}

function ItemsEditorPlaceholder({ brandId }: { brandId: string }) {
  void brandId;
  return null;
}
