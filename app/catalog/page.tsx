import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import type { CatalogPage } from "@/data/catalog";
import { brandPageUrl, brandCoverUrl, type BrandCatalog } from "@/data/brandCatalogs";
import UnifiedCatalogViewer, { type BrandEntry } from "@/components/UnifiedCatalogViewer";

export const metadata: Metadata = {
  title: "2026 SS 카탈로그 | WORKUP",
  description: "WORKUP 2026 Spring/Summer 신제품 카탈로그와 입점 브랜드 카탈로그를 한곳에서.",
};

// WORKUP 카탈로그 페이지 + 타사 브랜드 카탈로그를 함께 읽는다(관리자 수정 즉시 반영).
async function getData(): Promise<{ pages: CatalogPage[]; brands: BrandCatalog[] }> {
  noStore();
  try {
    const supabase = createAdminClient();
    const [{ data: pages }, { data: brandsData }] = await Promise.all([
      supabase.from("catalog_pages").select("*").eq("is_visible", true).order("sort_order", { ascending: true }).order("id", { ascending: true }),
      supabase.from("brand_catalogs").select("*").eq("is_visible", true).order("sort_order", { ascending: true }).order("id", { ascending: true }),
    ]);
    return { pages: (pages as CatalogPage[]) ?? [], brands: (brandsData as BrandCatalog[]) ?? [] };
  } catch {
    return { pages: [], brands: [] };
  }
}

export default async function CatalogPage() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const { pages, brands } = await getData();

  const brandEntries: BrandEntry[] = brands
    .filter((b) => b.pdf_public_id)
    .map((b) => ({
      id: b.id,
      name: b.brand_name,
      cover: b.thumbnail_url || (cloud ? brandCoverUrl(cloud, b.pdf_public_id) : ""),
      pages: cloud && b.page_count > 0 ? Array.from({ length: b.page_count }, (_, i) => brandPageUrl(cloud, b.pdf_public_id, i + 1)) : [],
      pdf_url: b.pdf_url || "",
    }));

  if (pages.length === 0 && brandEntries.length === 0) {
    return <main><CatalogEmpty /></main>;
  }

  return (
    <main>
      <UnifiedCatalogViewer workupPages={pages} brands={brandEntries} />
    </main>
  );
}

// 등록된 카탈로그가 없을 때 — 빈 화면 대신 매장/제품으로 안내(오프라인 전환 유지).
function CatalogEmpty() {
  return (
    <div className="bg-[#0d1826] flex flex-col items-center justify-center text-center px-6" style={{ height: "calc(100vh - var(--wu-topbar-h, 36px) - 56px)" }}>
      <p className="text-[10px] tracking-[0.3em] text-[#ff550c] uppercase mb-4">Catalog</p>
      <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">카탈로그를 준비하고 있습니다</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">새 카탈로그가 곧 공개됩니다.<br />그동안 제품과 가까운 매장을 먼저 둘러보세요.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/products" className="inline-block bg-[#ff550c] text-white text-sm tracking-widest px-7 py-3 hover:bg-[#d05518] transition-colors">제품 보기</Link>
        <Link href="/store" className="inline-block border border-white/40 text-white text-sm tracking-widest px-7 py-3 hover:bg-white hover:text-[#1A2B4A] transition-colors">매장 찾기</Link>
      </div>
    </div>
  );
}
