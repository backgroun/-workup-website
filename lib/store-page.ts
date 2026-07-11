// 매장 찾기(/store) 페이지 상단(히어로) 편집 설정.
// site_settings.section = "store_page"

export type StorePageConfig = {
  title: string;
  description: string; // {count} 토큰은 매장 수로 치환됨
  bullets: string[];
};

export const DEFAULT_STORE_PAGE: StorePageConfig = {
  title: "직접 입어봐야 압니다.",
  description: "몸으로 느끼는 기능은 화면으로 전할 수 없습니다.\n전국 {count}개 매장에서 직접 확인해 보세요.",
  bullets: [
    "직종을 말씀해 주시면 맞춤 추천해 드립니다.",
    "방문 전 피팅리스트 제품 재고 상황을 유선상으로 확인할 수 있습니다.",
    "사이즈 교환은 매장에 사이즈가 있을 경우 가능합니다.",
  ],
};

export function normalizeStorePage(
  c: Partial<StorePageConfig> | null | undefined,
): StorePageConfig {
  if (!c) return DEFAULT_STORE_PAGE;
  return {
    title: (c.title ?? "").trim() || DEFAULT_STORE_PAGE.title,
    description: typeof c.description === "string" ? c.description : DEFAULT_STORE_PAGE.description,
    bullets: Array.isArray(c.bullets)
      ? c.bullets.filter((b): b is string => typeof b === "string")
      : DEFAULT_STORE_PAGE.bullets,
  };
}
