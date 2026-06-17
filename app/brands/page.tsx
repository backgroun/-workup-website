import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { brandPageUrl, brandCoverUrl, type BrandCatalog } from "@/data/brandCatalogs";
import BrandCatalogViewer, { type BrandViewModel } from "@/components/BrandCatalogViewer";

export const metadata: Metadata = {
  title: "브랜드 카탈로그 | WORKUP",
  description: "WORKUP 매장에서 만나는 다양한 브랜드 카탈로그를 한곳에서.",
  robots: { index: false, follow: false }, // 타사 저작물 — 검색 비노출
};

async function getVisibleBrands(): Promise<BrandCatalog[]> {
  noStore();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("brand_catalogs")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    return (data as BrandCatalog[]) ?? [];
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const brands = await getVisibleBrands();

  // 페이지 이미지 URL을 서버에서 생성 (NEXT_PUBLIC 환경변수 불필요)
  const models: BrandViewModel[] = brands
    .filter((b) => b.pdf_public_id)
    .map((b) => ({
      id: b.id,
      brand_name: b.brand_name,
      cover: b.thumbnail_url || (cloud ? brandCoverUrl(cloud, b.pdf_public_id) : ""),
      pages: cloud && b.page_count > 0
        ? Array.from({ length: b.page_count }, (_, i) => brandPageUrl(cloud, b.pdf_public_id, i + 1))
        : [],
      pdf_url: b.pdf_url || "",
    }));

  return (
    <main>
      {models.length > 0 ? <BrandCatalogViewer brands={models} /> : <BrandEmpty />}
    </main>
  );
}

// 등록된 브랜드 카탈로그가 없을 때 — 빈 화면 대신 매장/제품으로 안내(오프라인 전환 유지).
function BrandEmpty() {
  return (
    <div className="bg-[#0d1826] flex flex-col items-center justify-center text-center px-6" style={{ height: "calc(100vh - 92px)" }}>
      <p className="text-[10px] tracking-[0.3em] text-[#ff550c] uppercase mb-4">Brand Catalog</p>
      <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">브랜드 카탈로그를 준비하고 있습니다</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">다양한 브랜드 카탈로그가 곧 공개됩니다.<br />그동안 제품과 가까운 매장을 먼저 둘러보세요.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/products" className="inline-block bg-[#ff550c] text-white text-sm tracking-widest px-7 py-3 hover:bg-[#d05518] transition-colors">제품 보기</Link>
        <Link href="/store" className="inline-block border border-white/40 text-white text-sm tracking-widest px-7 py-3 hover:bg-white hover:text-[#1A2B4A] transition-colors">매장 찾기</Link>
      </div>
    </div>
  );
}
