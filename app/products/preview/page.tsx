"use client";
import { useState, useEffect } from "react";
import type { Product } from "@/data/products";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductTabs from "@/components/ProductTabs";
import StickyAside from "@/components/StickyAside";

// 제품 등록/수정 폼의 "미리보기" 버튼이 sessionStorage("wu-product-preview")에 담은
// 현재 입력값을 실제 상세페이지 레이아웃으로 렌더한다(저장 전 확인용).
export default function ProductPreviewPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wu-product-preview");
      if (raw) setProduct(JSON.parse(raw) as Product);
      else setEmpty(true);
    } catch {
      setEmpty(true);
    }
  }, []);

  if (empty) {
    return (
      <main className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-lg font-bold text-[#1A2B4A] mb-2">미리보기 데이터가 없습니다.</p>
          <p className="text-sm text-gray-500">제품 등록/수정 화면에서 <b>미리보기</b> 버튼을 눌러 열어주세요.</p>
        </div>
      </main>
    );
  }
  if (!product) {
    return <main className="min-h-screen flex items-center justify-center text-gray-400 text-sm">불러오는 중…</main>;
  }

  return (
    <main className="bg-white min-h-screen">
      <div className="bg-[#1A2B4A] text-white text-center text-[13px] py-2">
        미리보기 모드 — 저장되지 않은 화면입니다. 실제 반영은 저장 후 적용됩니다.
      </div>
      <div className="md:flex md:items-start max-w-screen-2xl mx-auto">
        <div className="w-full md:w-[58%] lg:w-[62%]">
          <ProductImageGallery product={product} />
          <div className="hidden md:block mt-[210px]">
            <ProductTabs product={product} />
          </div>
        </div>
        <StickyAside className="w-full md:w-[42%] lg:w-[38%]">
          <ProductDetailClient product={product} relatedProducts={[]} isNewLayout={false} />
        </StickyAside>
      </div>
      <div className="md:hidden">
        <ProductTabs product={product} />
      </div>
    </main>
  );
}
