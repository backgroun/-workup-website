// 브랜드별 카탈로그 서버 로더 — 공개 페이지(app/brands/[id]/catalog)에서 사용.
// catalog_pages 테이블(brand_id 로 브랜드 분리) + UnifiedCatalogViewer 플립북.
import { BRANDS } from "@/lib/brands-data";
import { createAdminClient } from "@/lib/supabase-server";
import type { Brand } from "@/data/brands";
import type { CatalogPage } from "@/data/catalog";

// 브랜드명 → URL 슬러그. 정적 BRANDS는 고정 id를 쓰고, DB 전용 브랜드는 이 함수로 슬러그를 만든다.
export function brandSlug(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type LoadedBrandCatalog = { brand: Brand; pages: CatalogPage[] };

// 슬러그(정적 BRANDS.id 또는 slugify(브랜드명)) → 그 브랜드 + 공개 카탈로그 페이지들
export async function loadBrandCatalog(
  slug: string,
  opts: { includeHidden?: boolean } = {},
): Promise<LoadedBrandCatalog | null> {
  const staticBrand = BRANDS.find((b) => b.id === slug);
  try {
    const sb = createAdminClient();
    let brand: Brand | null = null;
    if (staticBrand) {
      const { data } = await sb.from("brands").select("*").ilike("name", staticBrand.name).maybeSingle();
      brand = (data as Brand) ?? null;
    } else {
      const { data: all } = await sb.from("brands").select("*");
      brand = ((all as Brand[]) ?? []).find((b) => brandSlug(b.name) === slug) ?? null;
    }
    if (!brand) return null;
    if (brand.catalog_enabled !== true && !opts.includeHidden) return null;

    let q = sb.from("catalog_pages").select("*")
      .eq("brand_id", String(brand.id))
      .order("sort_order", { ascending: true }).order("id", { ascending: true });
    if (!opts.includeHidden) q = q.eq("is_visible", true);
    const { data: rows } = await q;
    const pages = ((rows as CatalogPage[]) ?? []).map((p) => ({
      ...p, page_type: p.page_type ?? "image", data: p.data ?? {},
    }));
    return { brand, pages };
  } catch (e) {
    console.error("[brandCatalog] loadBrandCatalog failed:", e);
    return null;
  }
}
