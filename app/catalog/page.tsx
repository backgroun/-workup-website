import type { Metadata } from "next";
import CatalogFlipBook from "@/components/CatalogFlipBook";

export const metadata: Metadata = {
  title: "2026 SS 카탈로그 | WORKUP",
  description: "WORKUP 2026 Spring/Summer 신제품 카탈로그. 작업복·셋업·캐주얼·안전용품 전 라인업.",
};

export default function CatalogPage() {
  return (
    <main>
      <CatalogFlipBook />
    </main>
  );
}
