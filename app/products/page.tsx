import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsGrid from "@/components/ProductsGrid";

export const metadata: Metadata = {
  title: "PRODUCTS — 제품 | WORKUP",
  description: "워크업이 검증한 기능성 워크웨어. 카테고리별로 찾아보세요.",
};

export default function ProductsPage() {
  return (
    <main>
      <Suspense fallback={<div className="py-24 text-center text-sm text-gray-400">로딩 중...</div>}>
        <ProductsGrid />
      </Suspense>
    </main>
  );
}
