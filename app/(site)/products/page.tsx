import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsGrid, { type CatItem } from "@/components/ProductsGrid";
import Hero from "@/components/Hero";
import { createAdminClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "PRODUCTS — 제품 | WORKUP",
  description: "워크업이 검증한 기능성 워크웨어. 카테고리별로 찾아보세요.",
};

// 첫 화면부터 최신 분류를 그리도록 서버에서 카테고리를 읽어 전달한다 (옛 카테고리 깜빡임 방지)
async function getCategories(): Promise<CatItem[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "categories")
      .maybeSingle();
    const cats = data?.config?.categories;
    if (Array.isArray(cats)) return cats as CatItem[];
  } catch {
    // DB 실패 시 빈 목록 — 클라이언트에서 재시도
  }
  return [];
}

export default async function ProductsPage() {
  const initialCats = await getCategories();
  return (
    <main>
      {/* 상단 상품 비주얼 슬라이더 (slide_type="product") — 슬라이드가 없으면 표시되지 않음 */}
      <Suspense fallback={null}>
        <Hero slideType="product" />
      </Suspense>
      <Suspense fallback={<div className="py-24 text-center text-sm text-gray-400">로딩 중...</div>}>
        <ProductsGrid initialCats={initialCats} />
      </Suspense>
    </main>
  );
}
