import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { BRANDS } from "@/lib/brands-data";
import { createAdminClient } from "@/lib/supabase-server";
import { brandSlug } from "@/lib/brandCatalog-server";
import type { Brand } from "@/data/brands";
import BrandsPageClient from "@/components/BrandsPageClient";

export const metadata: Metadata = {
  title: "브랜드 카탈로그 | WORKUP",
  description: "WORKUP K-WORKER STORE 입점 브랜드 카탈로그를 한눈에 확인하세요.",
};

export type BrandItem = {
  id: string;
  name: string;
  positioning: string;
  descriptionKo: string;
  description: string;
  href: string;
  accentColor: string;
  heroImage: string;
  imageBg: string;
  hasCatalog: boolean;
};

async function getBrandsData(): Promise<BrandItem[]> {
  noStore();
  try {
    const supabase = createAdminClient();
    const [{ data: dbBrands }, { data: catalogs }, { data: asmItems }] = await Promise.all([
      supabase.from("brands").select("id, name, name_ko, positioning, description, accent_color, image_bg, mega_menu_image, is_visible, catalog_enabled, catalog_cover_url").order("sort_order", { ascending: true }).order("name", { ascending: true }),
      supabase.from("brand_catalogs").select("brand_name").eq("is_visible", true),
      supabase.from("catalog_pages").select("brand_id").eq("is_visible", true).neq("brand_id", ""),
    ]);

    // 이름 표기 차이(예: "MAD DOG" vs "MADDOG")를 흡수하는 정규화 키
    const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");

    const catalogNames = new Set(
      (catalogs ?? []).map((c: { brand_name: string }) => norm(c.brand_name))
    );
    // 조립형 카탈로그(공개 + 노출 제품 1개 이상)를 가진 브랜드 id
    const asmBrandIds = new Set(
      ((asmItems as { brand_id: unknown }[]) ?? []).map((r) => String(r.brand_id))
    );
    const hasAssembled = (db: Brand | null | undefined) =>
      !!db && db.catalog_enabled === true && asmBrandIds.has(String(db.id));
    const findDb = (name: string) =>
      (dbBrands ?? []).find((d: Brand) => norm(d.name) === norm(name)) ?? null;

    // 정적 BRANDS → 매칭되는 DB 레코드가 is_visible=false면 제외
    const staticVisible = BRANDS.filter((b) => {
      const db = findDb(b.name);
      return !db || db.is_visible !== false;
    });

    // DB 전용 브랜드: 정적 BRANDS와 정규화 이름이 겹치지 않고 is_visible=false가 아닌 것
    const staticNorm = new Set(BRANDS.map((b) => norm(b.name)));
    const dbOnlyVisible = (dbBrands ?? []).filter(
      (d: Brand) => !staticNorm.has(norm(d.name)) && d.is_visible !== false
    );

    // 정적 브랜드 → BrandItem 변환
    const staticItems: BrandItem[] = staticVisible.map((b) => {
      const db = findDb(b.name);
      const bgValue = db?.image_bg || b.imageBg || "";
      // 카드 이미지: 목록 카드 전용 이미지(catalog_cover_url) 우선 → 메가메뉴 이미지 → 배경 URL
      const heroImage = db?.catalog_cover_url || db?.mega_menu_image || (bgValue.startsWith("http") ? bgValue : "") || "";
      return {
        id: b.id,
        name: db?.name || b.name,
        positioning: db?.positioning || b.positioning,
        descriptionKo: db?.name_ko || b.descriptionKo,
        description: db?.description || b.description,
        href: b.href,
        accentColor: db?.accent_color || b.accentColor,
        heroImage,
        imageBg: heroImage ? "" : bgValue,
        hasCatalog: catalogNames.has(norm(b.name)) || hasAssembled(db),
      };
    });

    // DB 전용 브랜드 → BrandItem 변환
    const dbOnlyItems: BrandItem[] = dbOnlyVisible.map((d: Brand) => {
      const bgValue = d.image_bg || "";
      const heroImage = d.catalog_cover_url || d.mega_menu_image || (bgValue.startsWith("http") ? bgValue : "") || "";
      const catalog = catalogNames.has(norm(d.name)) || hasAssembled(d);
      return {
        id: String(d.id),
        name: d.name,
        positioning: d.positioning || "",
        descriptionKo: d.name_ko || "",
        description: d.description || "",
        href: `/brands/${brandSlug(d.name)}`,
        accentColor: d.accent_color || "#333333",
        heroImage,
        imageBg: heroImage ? "" : bgValue,
        hasCatalog: catalog,
      };
    });

    const allItems = [...staticItems, ...dbOnlyItems];

    // 정렬: 카탈로그 있는 브랜드 먼저, 각 그룹 내 가나다순
    allItems.sort((a, b) => {
      if (a.hasCatalog !== b.hasCatalog) return a.hasCatalog ? -1 : 1;
      const aKo = (a.descriptionKo || a.name).toLowerCase();
      const bKo = (b.descriptionKo || b.name).toLowerCase();
      return aKo.localeCompare(bKo, "ko");
    });

    return allItems;
  } catch {
    return BRANDS.map((b) => ({
      id: b.id,
      name: b.name,
      positioning: b.positioning,
      descriptionKo: b.descriptionKo,
      description: b.description,
      href: b.href,
      accentColor: b.accentColor,
      heroImage: "",
      imageBg: b.imageBg,
      hasCatalog: false,
    }));
  }
}

export default async function BrandsPage() {
  const brands = await getBrandsData();
  return (
    <main className="min-h-screen bg-white">
      {/* 헤더 히어로 */}
      <section className="relative bg-gray-900 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-14 md:py-20 flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#E5541B] uppercase font-bold mb-3">K-WORKER STORE</p>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              일할 때도, 일상에서도<br />
              <span className="text-[#E5541B]">WORKUP</span>이 선택한<br />
              좋은 브랜드들
            </h1>
            <p className="text-sm text-white/50 mt-4 max-w-sm leading-relaxed">
              기능성과 디자인, 그리고 현장 중심의 기준까지.<br />
              WORKUP이 직접 경험하고 믿을 수 있는 브랜드만을 소개합니다.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href="/stores"
              className="px-6 py-3 bg-[#E5541B] text-white text-sm font-bold rounded-lg hover:bg-[#d14d18] transition-colors text-center">
              가까운 매장 찾기
            </Link>
            <a href="tel:0000000000"
              className="px-6 py-3 border border-white/30 text-white/80 text-sm font-semibold rounded-lg hover:border-white/60 transition-colors text-center">
              전화 문의
            </a>
          </div>
        </div>
      </section>

      {/* 브랜드 그리드 (클라이언트: 탭 필터) */}
      <BrandsPageClient brands={brands} />
    </main>
  );
}
