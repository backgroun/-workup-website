// 조립형 카탈로그 서버 로더 — 공개 페이지(app/brands/[id]/catalog)와 관리자 미리보기에서 사용.
import { BRANDS } from "@/lib/brands-data";
import { createAdminClient } from "@/lib/supabase-server";
import type { Brand } from "@/data/brands";
import type { BrandCatalogItem, BrandCatalogMeta, CatalogColorVariant, CatalogSpec } from "@/data/brandCatalog";

export type LoadedBrandCatalog = { brand: Brand; meta: BrandCatalogMeta; items: BrandCatalogItem[] };

// 브랜드명 → URL 슬러그. 정적 BRANDS는 고정 id를 쓰고, DB 전용 브랜드는 이 함수로 슬러그를 만든다.
export function brandSlug(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeItem(row: Record<string, unknown>): BrandCatalogItem {
  return {
    id: String(row.id ?? ""),
    brand_id: String(row.brand_id ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_visible: row.is_visible !== false,
    category: String(row.category ?? ""),
    name: String(row.name ?? ""),
    summary: String(row.summary ?? ""),
    description: String(row.description ?? ""),
    price: String(row.price ?? ""),
    main_image_url: String(row.main_image_url ?? ""),
    specs: asArray<CatalogSpec>(row.specs),
    colors: asArray<CatalogColorVariant>(row.colors),
    tech_images: asArray<string>(row.tech_images),
  };
}

function metaFromBrand(brand: Brand): BrandCatalogMeta {
  return {
    enabled: brand.catalog_enabled === true,
    cover_url: brand.catalog_cover_url ?? "",
    season: brand.catalog_season ?? "",
    headline: brand.catalog_headline ?? "",
    intro: brand.catalog_intro ?? "",
    tech_images: asArray<string>(brand.catalog_tech_images),
  };
}

export async function loadBrandCatalog(
  slug: string,
  opts: { includeHidden?: boolean } = {},
): Promise<LoadedBrandCatalog | null> {
  const staticBrand = BRANDS.find((b) => b.id === slug);

  try {
    const sb = createAdminClient();
    let brandRow: unknown = null;

    if (staticBrand) {
      const { data } = await sb.from("brands").select("*").ilike("name", staticBrand.name).maybeSingle();
      brandRow = data;
    } else {
      // DB 전용 브랜드: slugify(name) === slug 인 브랜드를 찾는다 (SQL로 슬러그 계산이 어려워 이름만 받아 매칭)
      const { data: names } = await sb.from("brands").select("id, name");
      const match = (names as { id: unknown; name: string }[] | null ?? []).find(
        (b) => brandSlug(b.name) === slug,
      );
      if (match) {
        const { data } = await sb.from("brands").select("*").eq("id", match.id).maybeSingle();
        brandRow = data;
      }
    }
    if (!brandRow) return null;

    const brand = brandRow as Brand;
    const meta = metaFromBrand(brand);
    if (!meta.enabled && !opts.includeHidden) return null;

    let q = sb
      .from("brand_catalog_items")
      .select("*")
      .eq("brand_id", String(brand.id))
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (!opts.includeHidden) q = q.eq("is_visible", true);

    const { data: rows } = await q;
    const items = (rows ?? []).map((r) => normalizeItem(r as Record<string, unknown>));
    return { brand, meta, items };
  } catch (e) {
    console.error("[brandCatalog] loadBrandCatalog failed:", e);
    return null;
  }
}
