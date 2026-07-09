// 전체상품(공개) 페이지 상단 필터 설정 — 관리자가 사이즈 목록·가격 구간을 조정.
// site_settings의 'product_filters' 섹션에 저장.

export type PriceRange = {
  label: string;        // 표시 라벨 (예: "3만원 이하")
  min: number;          // 최소 금액(원, 포함)
  max: number | null;   // 최대 금액(원, 미만). null = 상한 없음("이상")
};

export type ProductFiltersConfig = {
  sizes: string[];            // 사이즈 필터 옵션
  priceRanges: PriceRange[];  // 가격 필터 구간
};

export const DEFAULT_PRODUCT_FILTERS: ProductFiltersConfig = {
  sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  priceRanges: [
    { label: "3만원 이하", min: 0, max: 30000 },
    { label: "3~5만원", min: 30000, max: 50000 },
    { label: "5~8만원", min: 50000, max: 80000 },
    { label: "8만원 이상", min: 80000, max: null },
  ],
};

export function normalizeProductFilters(raw: unknown): ProductFiltersConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PRODUCT_FILTERS };
  const r = raw as Partial<ProductFiltersConfig>;
  const sizes = Array.isArray(r.sizes)
    ? r.sizes.map((s) => String(s).trim()).filter(Boolean)
    : DEFAULT_PRODUCT_FILTERS.sizes;
  const priceRanges = Array.isArray(r.priceRanges)
    ? r.priceRanges
        .filter((p): p is PriceRange => !!p && typeof p.label === "string" && p.label.trim() !== "")
        .map((p) => ({
          label: p.label.trim(),
          min: Number.isFinite(p.min) ? Number(p.min) : 0,
          max: p.max === null || p.max === undefined ? null : (Number.isFinite(p.max) ? Number(p.max) : null),
        }))
    : DEFAULT_PRODUCT_FILTERS.priceRanges;
  return {
    sizes: sizes.length ? sizes : DEFAULT_PRODUCT_FILTERS.sizes,
    priceRanges: priceRanges.length ? priceRanges : DEFAULT_PRODUCT_FILTERS.priceRanges,
  };
}

// 가격 문자열("39,000원")이 구간에 속하는지 — min 이상, max 미만(max=null이면 상한 없음)
export function priceInRange(priceStr: string, range: PriceRange): boolean {
  const n = parseInt((priceStr ?? "").replace(/[^0-9]/g, ""), 10);
  if (Number.isNaN(n)) return false;
  if (n < range.min) return false;
  if (range.max !== null && n >= range.max) return false;
  return true;
}
