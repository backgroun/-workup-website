import type { Product } from "@/data/products";

// 메인 "신상품 영역" 설정 — 관리자(/admin/main/new-arrivals)와 프론트(HomeNewArrivals)가 공유한다.
export type NewArrivalsMode = "auto" | "manual";
export type NewArrivalsSortBy = "latest" | "sales" | "recommended";

export type NewArrivalsConfig = {
  title: string;
  is_visible: boolean;
  mode: NewArrivalsMode;
  sort_by: NewArrivalsSortBy;
  count: number;
  category_filter: string;
  manual_ids: string[];
  hide_sold_out: boolean;
  show_discount_badge: boolean;
  show_category_tabs: boolean;
  new_product_days: number;
  view_all_link: string;
};

export const DEFAULT_NEW_ARRIVALS: NewArrivalsConfig = {
  title: "신상품이 입고 되었어요",
  is_visible: true,
  mode: "auto",
  sort_by: "latest",
  count: 10,
  category_filter: "전체",
  manual_ids: [],
  hide_sold_out: true,
  show_discount_badge: false,
  show_category_tabs: true,
  new_product_days: 60,
  view_all_link: "/products?new=true",
};

// 저장값(부분·null 가능)을 기본값과 병합
export function normalizeNewArrivals(raw: unknown): NewArrivalsConfig {
  const c = raw && typeof raw === "object" ? (raw as Partial<NewArrivalsConfig>) : {};
  return { ...DEFAULT_NEW_ARRIVALS, ...c };
}

// 메인에 진열 가능한 상태(판매중지·진열대기는 제외)
const DISPLAYED_STATUSES = new Set(["판매중", "예약판매", "품절"]);
const isDisplayed = (p: Product) => DISPLAYED_STATUSES.has(p.status ?? "판매중");
const isSoldOut = (p: Product) => (p.status ?? "판매중") === "품절";

function dateVal(d?: string): number {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isWithinDays(p: Product, days: number): boolean {
  const t = dateVal(p.createdAt);
  if (!t) return false;
  return (Date.now() - t) / 86_400_000 <= days;
}

// 관리자 설정 + 전체 상품 → 노출 상품 풀(카테고리 탭/개수 적용 전).
// - manual: manual_ids 순서대로(설정한 상품만)
// - auto:   isNew 또는 등록 N일 이내, 카테고리 필터·정렬 적용
export function selectNewArrivalsPool(products: Product[], cfg: NewArrivalsConfig): Product[] {
  let pool: Product[];

  if (cfg.mode === "manual") {
    const byId = new Map(products.map((p) => [p.id, p]));
    pool = cfg.manual_ids
      .map((id) => byId.get(id))
      .filter((p): p is Product => !!p)
      .filter(isDisplayed);
  } else {
    pool = products
      .filter(isDisplayed)
      .filter((p) => p.isNew || isWithinDays(p, cfg.new_product_days));
    if (cfg.category_filter && cfg.category_filter !== "전체") {
      pool = pool.filter((p) => p.category === cfg.category_filter);
    }
    if (cfg.sort_by === "latest") {
      pool = [...pool].sort((a, b) => dateVal(b.createdAt) - dateVal(a.createdAt));
    }
    // sales/recommended: 별도 데이터가 없어 products API 기본 정렬(sort_order·created_at) 유지
  }

  if (cfg.hide_sold_out) pool = pool.filter((p) => !isSoldOut(p));
  return pool;
}
