// 찜(피팅 리스트) 페이지 화면 구성 설정 — 타입 / 기본값 / 정규화.
// ⚠️ 클라이언트(관리자·찜 페이지)와 서버 양쪽에서 import 되므로 서버 전용 코드 금지.
import { safeHref } from "./topbar";

export type WishlistConfig = {
  // 상단 히어로
  heroEyebrow: string;
  heroTitle: string;
  heroDesc: string;
  // 빈 상태
  emptyTitle: string;
  emptyDesc: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
  // 매장 방문 안내 배너
  noticeTitle: string;
  noticeDesc: string;
  noticeCtaLabel: string;
  noticeCtaHref: string;
  // 하단 액션
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

// 현재 찜(피팅 리스트) 페이지에 하드코딩돼 있던 문구와 동일.
export const DEFAULT_WISHLIST: WishlistConfig = {
  heroEyebrow: "FITTING LIST",
  heroTitle: "피팅 리스트",
  heroDesc: "매장 방문 시 이 목록을 직원에게 보여주세요.",
  emptyTitle: "담은 제품이 없습니다.",
  emptyDesc: "마음에 드는 제품을 골라 피팅 리스트에 담아보세요.",
  emptyCtaLabel: "제품 보러가기 →",
  emptyCtaHref: "/products",
  noticeTitle: "매장 방문 안내",
  noticeDesc: "아래 목록을 매장 직원에게 보여주시면 더 빠르게 원하는 제품을 입어볼 수 있습니다. 재고 및 사이즈는 매장에서 바로 확인해 드립니다.",
  noticeCtaLabel: "가까운 매장 찾기 →",
  noticeCtaHref: "/store",
  primaryLabel: "매장 찾아서 입어보기 →",
  primaryHref: "/store",
  secondaryLabel: "제품 더 보기",
  secondaryHref: "/products",
};

// 문자열 필드는 비어 있으면 기본값으로, href 는 안전한 스킴만 통과시킨다.
export function normalizeWishlist(raw: Partial<WishlistConfig> | null | undefined): WishlistConfig {
  const c = raw ?? {};
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v : fallback;
  const link = (v: unknown, fallback: string) =>
    (typeof v === "string" ? safeHref(v) : "") || fallback;
  return {
    heroEyebrow: str(c.heroEyebrow, DEFAULT_WISHLIST.heroEyebrow),
    heroTitle: str(c.heroTitle, DEFAULT_WISHLIST.heroTitle),
    heroDesc: str(c.heroDesc, DEFAULT_WISHLIST.heroDesc),
    emptyTitle: str(c.emptyTitle, DEFAULT_WISHLIST.emptyTitle),
    emptyDesc: str(c.emptyDesc, DEFAULT_WISHLIST.emptyDesc),
    emptyCtaLabel: str(c.emptyCtaLabel, DEFAULT_WISHLIST.emptyCtaLabel),
    emptyCtaHref: link(c.emptyCtaHref, DEFAULT_WISHLIST.emptyCtaHref),
    noticeTitle: str(c.noticeTitle, DEFAULT_WISHLIST.noticeTitle),
    noticeDesc: str(c.noticeDesc, DEFAULT_WISHLIST.noticeDesc),
    noticeCtaLabel: str(c.noticeCtaLabel, DEFAULT_WISHLIST.noticeCtaLabel),
    noticeCtaHref: link(c.noticeCtaHref, DEFAULT_WISHLIST.noticeCtaHref),
    primaryLabel: str(c.primaryLabel, DEFAULT_WISHLIST.primaryLabel),
    primaryHref: link(c.primaryHref, DEFAULT_WISHLIST.primaryHref),
    secondaryLabel: str(c.secondaryLabel, DEFAULT_WISHLIST.secondaryLabel),
    secondaryHref: link(c.secondaryHref, DEFAULT_WISHLIST.secondaryHref),
  };
}
