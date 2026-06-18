// 헤더 내비게이션(탑바 아래 GNB) 메뉴 설정 — 타입 / 기본값 / 정규화.
// ⚠️ 이 파일은 클라이언트(관리자 페이지)와 서버(헤더/하단바) 양쪽에서 import 되므로
//    서버 전용 코드를 넣지 않는다. 서버 전용 조회 로직은 lib/header-nav-server.ts 에 둔다.
import { safeHref } from "./topbar";

export type NavMenuItem = {
  id: string;
  label: string;   // 메뉴 표시 텍스트(한글/영문 자유)
  href: string;    // 이동 경로
  newTab?: boolean; // 새 탭으로 열기
};

export type HeaderNavConfig = {
  items: NavMenuItem[];
};

// 현재 사이트에 하드코딩돼 있던 기본 메뉴와 동일.
export const DEFAULT_HEADER_NAV: HeaderNavConfig = {
  items: [
    { id: "nav-products", label: "PRODUCTS", href: "/products" },
    { id: "nav-store", label: "STORE", href: "/store" },
    { id: "nav-story", label: "STORY", href: "/story" },
    { id: "nav-mate", label: "MATE", href: "/people" },
    { id: "nav-field-test", label: "FIELD TEST", href: "/field-test" },
  ],
};

// 저장된 JSON(부분/구버전 가능)을 안전한 완전체 설정으로 보정한다.
// label·href가 모두 있어야 유효한 메뉴로 본다. 결과가 비면(전부 삭제 등)
// 내비게이션이 통째로 사라지지 않도록 기본 메뉴로 폴백한다.
export function normalizeHeaderNav(raw: Partial<HeaderNavConfig> | null | undefined): HeaderNavConfig {
  const c = raw ?? {};
  const items = Array.isArray(c.items)
    ? c.items
        .filter((it): it is NavMenuItem => !!it && typeof it === "object")
        .map((it, i) => ({
          id: typeof it.id === "string" && it.id ? it.id : `nav-${i}`,
          label: typeof it.label === "string" ? it.label.trim() : "",
          href: safeHref(it.href),
          newTab: !!it.newTab,
        }))
        .filter((it) => it.label !== "" && it.href !== "")
    : DEFAULT_HEADER_NAV.items;

  return { items: items.length ? items : DEFAULT_HEADER_NAV.items };
}
