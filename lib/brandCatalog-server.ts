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

// 이름 표기 차이("MAD DOG" vs "MADDOG")를 흡수하는 정규화 키
const normName = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");

// URL 슬러그 → 브랜드. 다음을 모두 지원:
//   - 정적 BRANDS.id (예: "maddog", "detroit")
//   - DB brands.id 숫자 (예: "14") — 관리자 편집기가 ?brand=<id> 로 넘기는 값
//   - slugify(브랜드명) (예: "k-workers") — DB 전용 브랜드
export async function loadBrandCatalog(
  slug: string,
  opts: { includeHidden?: boolean } = {},
): Promise<LoadedBrandCatalog | null> {
  const staticBrand = BRANDS.find((b) => b.id === slug);
  try {
    const sb = createAdminClient();
    const { data: all } = await sb.from("brands").select("*");
    const brands = (all as Brand[]) ?? [];
    let brand: Brand | null = null;
    if (staticBrand) {
      brand = brands.find((b) => normName(b.name) === normName(staticBrand.name)) ?? null;
    } else if (/^\d+$/.test(slug)) {
      brand = brands.find((b) => String(b.id) === slug) ?? null;
    } else {
      brand = brands.find((b) => brandSlug(b.name) === slug) ?? null;
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
