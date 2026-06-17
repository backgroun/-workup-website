import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import type { CatalogPage } from "@/data/catalog";
import CatalogFlipBook from "@/components/CatalogFlipBook";

export const metadata: Metadata = {
  title: "2026 SS 카탈로그 | WORKUP",
  description: "WORKUP 2026 Spring/Summer 신제품 카탈로그. 작업복·셋업·캐주얼·안전용품 전 라인업.",
};

// 관리자(/admin/catalog)에서 등록한 '노출' 페이지만 순서대로 읽는다.
// 관리자 수정이 즉시 반영되도록 noStore() 사용. 실패 시 빈 배열.
async function getVisiblePages(): Promise<CatalogPage[]> {
  noStore();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("catalog_pages")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    return (data as CatalogPage[]) ?? [];
  } catch {
    return [];
  }
}

export default async function CatalogPage() {
  const pages = await getVisiblePages();

  return (
    <main>
      {pages.length > 0 ? <CatalogFlipBook pages={pages} /> : <CatalogEmpty />}
    </main>
  );
}

// 등록된 카탈로그가 아직 없을 때의 대체 화면 — 빈 화면 대신 매장/제품으로 안내(오프라인 전환 유지).
function CatalogEmpty() {
  return (
    <div
      className="bg-[#0d1826] flex flex-col items-center justify-center text-center px-6"
      style={{ height: "calc(100vh - 92px)" }}
    >
      <p className="text-[10px] tracking-[0.3em] text-[#ff550c] uppercase mb-4">Catalog</p>
      <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">
        카탈로그를 준비하고 있습니다
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        새 카탈로그가 곧 공개됩니다.
        <br />
        그동안 제품과 가까운 매장을 먼저 둘러보세요.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="inline-block bg-[#ff550c] text-white text-sm tracking-widest px-7 py-3 hover:bg-[#d05518] transition-colors"
        >
          제품 보기
        </Link>
        <Link
          href="/store"
          className="inline-block border border-white/40 text-white text-sm tracking-widest px-7 py-3 hover:bg-white hover:text-[#1A2B4A] transition-colors"
        >
          매장 찾기
        </Link>
      </div>
    </div>
  );
}
