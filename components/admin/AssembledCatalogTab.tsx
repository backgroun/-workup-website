"use client";
import { useEffect, useRef, useState } from "react";
import type { Brand } from "@/data/brands";
import {
  type BrandCatalogItem,
  type CatalogSpec,
  type CatalogColorVariant,
  EMPTY_CATALOG_ITEM,
  EMPTY_COLOR_VARIANT,
  slugifyColorKey,
} from "@/data/brandCatalog";

const INPUT = "w-full border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-800";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    let m = "업로드 실패";
    try {
      m = (await res.json())?.error ?? m;
    } catch {}
    throw new Error(m);
  }
  const d = await res.json();
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

      <p className="text-xs text-gray-400">이미지는 4MB 이하, 텍스트가 없는 순수 사진</p>

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

      {/* 제품 항목 편집기 */}
      <ItemsEditor brandId={String(brandId)} flash={flash} />
    </div>
  );
}

function ItemsEditor({ brandId, flash }: { brandId: string; flash: (t: string, type?: string) => void }) {
  const [items, setItems] = useState<BrandCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/brand-catalog-items?brandId=${encodeURIComponent(brandId)}`);
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const addItem = async () => {
    const r = await fetch("/api/admin/brand-catalog-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...EMPTY_CATALOG_ITEM, brand_id: brandId, sort_order: items.length }),
    });
    if (!r.ok) {
      flash("제품 추가 실패", "err");
      return;
    }
    const created = await r.json();
    if (created && typeof created.id === "string") {
      setItems((prev) => [...prev, created as BrandCatalogItem]);
    }
  };

  const patchLocal = (id: string, patch: Partial<BrandCatalogItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const saveItem = async (it: BrandCatalogItem) => {
    setSavingId(it.id);
    const r = await fetch(`/api/admin/brand-catalog-items/${it.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(it),
    });
    setSavingId(null);
    if (!r.ok) {
      flash("저장 실패", "err");
      return;
    }
    const saved = await r.json();
    if (saved && typeof saved.id === "string") {
      setItems((prev) => prev.map((x) => (x.id === saved.id ? (saved as BrandCatalogItem) : x)));
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm("이 제품 항목을 삭제할까요?")) return;
    const r = await fetch(`/api/admin/brand-catalog-items/${id}`, { method: "DELETE" });
    if (!r.ok) {
      flash("삭제 실패", "err");
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const reordered = [...items];
    [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
    const renumbered = reordered.map((it, i) => ({ ...it, sort_order: i }));
    setItems(renumbered);
    await Promise.all(
      renumbered.map((it) =>
        fetch(`/api/admin/brand-catalog-items/${it.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: it.sort_order }),
        }),
      ),
    );
  };

  if (loading) return <p className="text-gray-400 text-sm">제품 항목 불러오는 중…</p>;

  return (
    <div className="border-t pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">제품 항목 ({items.length})</h4>
        <button type="button" onClick={addItem} className="px-3 py-2 border rounded text-xs">+ 제품 추가</button>
      </div>

      {items.map((it, idx) => (
        <div key={it.id} className="border rounded p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => move(idx, -1)} className="px-2 border rounded text-xs">↑</button>
            <button type="button" onClick={() => move(idx, 1)} className="px-2 border rounded text-xs">↓</button>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={it.is_visible}
                onChange={(e) => patchLocal(it.id, { is_visible: e.target.checked })} />
              노출
            </label>
            <div className="ml-auto flex gap-2">
              <button type="button" disabled={savingId === it.id} onClick={() => saveItem(it)}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs">저장</button>
              <button type="button" onClick={() => removeItem(it.id)}
                className="px-3 py-1.5 border rounded text-xs text-red-600">삭제</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            <input className={INPUT} placeholder="카테고리 (상의·하의…)" value={it.category}
              onChange={(e) => patchLocal(it.id, { category: e.target.value })} />
            <input className={INPUT} placeholder="가격 (비우면 '가격 문의')" value={it.price}
              onChange={(e) => patchLocal(it.id, { price: e.target.value })} />
          </div>
          <input className={INPUT} placeholder="제품명" value={it.name}
            onChange={(e) => patchLocal(it.id, { name: e.target.value })} />
          <input className={INPUT} placeholder="한 줄 설명" value={it.summary}
            onChange={(e) => patchLocal(it.id, { summary: e.target.value })} />
          <textarea className={INPUT} rows={3} placeholder="상세 설명 (선택)" value={it.description}
            onChange={(e) => patchLocal(it.id, { description: e.target.value })} />

          <SpecsEditor specs={it.specs} onChange={(specs) => patchLocal(it.id, { specs })} />

          {/* 컬러 편집기 — Task 10 */}
          <ColorsEditor item={it} flash={flash} onChange={(colors) => patchLocal(it.id, { colors })} />
        </div>
      ))}
    </div>
  );
}

function SpecsEditor({ specs, onChange }: { specs: CatalogSpec[]; onChange: (s: CatalogSpec[]) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">스펙</p>
      {specs.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input className={INPUT} placeholder="항목 (소재)" value={s.label}
            onChange={(e) => onChange(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <input className={INPUT} placeholder="값 (면 100%)" value={s.value}
            onChange={(e) => onChange(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
          <button type="button" onClick={() => onChange(specs.filter((_, j) => j !== i))}
            className="px-2 border rounded text-xs">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...specs, { label: "", value: "" }])}
        className="px-2 py-1 border rounded text-xs">+ 스펙 행</button>
    </div>
  );
}

function ColorsEditor({
  item,
  flash,
  onChange,
}: {
  item: BrandCatalogItem;
  flash: (t: string, type?: string) => void;
  onChange: (c: CatalogColorVariant[]) => void;
}) {
  const colors = item.colors ?? [];
  const [busy, setBusy] = useState(false);

  const patchColor = (i: number, patch: Partial<CatalogColorVariant>) =>
    onChange(colors.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const addColor = () => {
    const taken = colors.map((c) => c.key);
    onChange([
      ...colors,
      { ...EMPTY_COLOR_VARIANT, key: slugifyColorKey("color", taken), label: "" },
    ]);
  };

  const setLabel = (i: number, label: string) => {
    // key는 addColor에서 이미 생성됨 — 공유된 딥링크 보존을 위해 재생성하지 않는다
    patchColor(i, { label });
  };

  const upload = async (i: number, field: "cutout_url" | "styled_url", file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      patchColor(i, { [field]: url } as Partial<CatalogColorVariant>);
    } catch (e) {
      flash(e instanceof Error ? e.message : "업로드 실패", "err");
    } finally {
      setBusy(false);
    }
  };

  const addGallery = async (i: number, file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      patchColor(i, { gallery: [...(colors[i].gallery ?? []), url] });
    } catch (e) {
      flash(e instanceof Error ? e.message : "업로드 실패", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">컬러</p>
      {colors.map((c, i) => (
        <div key={i} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              className={INPUT}
              placeholder="컬러명 (블랙)"
              value={c.label}
              onChange={(e) => setLabel(i, e.target.value)}
            />
            <input
              type="color"
              value={c.swatch || "#000000"}
              onChange={(e) => patchColor(i, { swatch: e.target.value })}
            />
            <button
              type="button"
              onClick={() => onChange(colors.filter((_, j) => j !== i))}
              className="px-2 border rounded text-xs"
            >
              삭제
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ImageField
              label="누끼컷 (칩)"
              url={c.cutout_url}
              busy={busy}
              onPick={(f) => upload(i, "cutout_url", f)}
            />
            <ImageField
              label="착장컷 (큰 이미지)"
              url={c.styled_url}
              busy={busy}
              onPick={(f) => upload(i, "styled_url", f)}
            />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">갤러리</p>
            <div className="flex flex-wrap gap-1 mb-1">
              {(c.gallery ?? []).map((g, gi) => (
                <div key={gi} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="w-14 h-14 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() =>
                      patchColor(i, {
                        gallery: (c.gallery ?? []).filter((_, j) => j !== gi),
                      })
                    }
                    className="absolute -top-1.5 -right-1.5 bg-white border rounded-full w-4 h-4 text-[10px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <GalleryAdd busy={busy} onPick={(f) => addGallery(i, f)} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addColor}
        className="px-2 py-1 border rounded text-xs"
      >
        + 컬러
      </button>
    </div>
  );
}

function ImageField({
  label,
  url,
  busy,
  onPick,
}: {
  label: string;
  url: string;
  busy: boolean;
  onPick: (f?: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-24 object-contain rounded border bg-white mb-1" />
      ) : null}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="px-2 py-1 border rounded text-[11px]"
      >
        업로드
      </button>
    </div>
  );
}

function GalleryAdd({ busy, onPick }: { busy: boolean; onPick: (f?: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="px-2 py-1 border rounded text-[11px]"
      >
        + 갤러리 이미지
      </button>
    </>
  );
}
