// 상품 상세 — "가까운 매장 찾기" 하단 사이드 배너(2개) 설정.
// 타입/기본값/정규화. 관리자(상세 배너 관리)와 상품 상세(클라이언트)에서 공용 import.
// ⚠️ 서버 전용 코드 금지 (양쪽에서 import).
import { safeHref } from "./topbar";

export type ProductBanner = { imageUrl: string; link: string };
export type ProductBannersConfig = { banners: ProductBanner[] }; // 항상 2개 고정

export const DEFAULT_PRODUCT_BANNERS: ProductBannersConfig = {
  banners: [
    { imageUrl: "", link: "" },
    { imageUrl: "", link: "" },
  ],
};

// 항상 2개 슬롯으로 정규화. link 는 안전한 스킴만 통과.
export function normalizeProductBanners(
  raw: Partial<ProductBannersConfig> | null | undefined
): ProductBannersConfig {
  const arr = Array.isArray(raw?.banners) ? raw!.banners : [];
  const banners: ProductBanner[] = [0, 1].map((i) => {
    const b = (arr[i] ?? {}) as Partial<ProductBanner>;
    return {
      imageUrl: typeof b.imageUrl === "string" ? b.imageUrl : "",
      link: (typeof b.link === "string" ? safeHref(b.link) : "") || "",
    };
  });
  return { banners };
}
