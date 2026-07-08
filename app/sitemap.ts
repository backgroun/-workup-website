import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { products, isPubliclyVisible } from "@/data/products";
import { getPublicStores } from "@/lib/publicStores";

// 검색 노출 대상 정적 마케팅 페이지 (관리자·개인/기능 페이지 제외)
const staticPaths = [
  "",
  "/products",
  "/catalog",
  "/store",
  "/brands",
  "/site",
  "/daily",
  "/pro",
  "/field-test",
  "/journal",
  "/people",
  "/story",
  "/studio",
  "/pr",
  "/careers",
  "/partnership",
  "/partnership/franchise",
  "/partnership/wholesale",
  "/support",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  // 공개 제품 상세 (지역명+제품명 검색 유입)
  const productEntries: MetadataRoute.Sitemap = products
    .filter(isPubliclyVisible)
    .map((p) => ({
      url: `${siteUrl}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  // 매장 상세 (지역명+매장명 로컬 SEO). 데이터 조회 실패해도 사이트맵은 유지.
  let storeEntries: MetadataRoute.Sitemap = [];
  try {
    const stores = await getPublicStores();
    storeEntries = stores.map((s) => ({
      url: `${siteUrl}/store/${s.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  } catch {
    // 조회 실패 시 매장 항목만 생략
  }

  return [...staticEntries, ...productEntries, ...storeEntries];
}
