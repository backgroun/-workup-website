// 사이트 로고(헤더·푸터 공통) 설정 — 타입 / 기본값 / 정규화.
// ⚠️ 클라이언트(관리자)와 서버(헤더/푸터) 양쪽에서 import 되므로 서버 전용 코드 금지.
//    서버 전용 조회 로직은 lib/logo-server.ts 에 둔다.
import { safeHref } from "./topbar";

export type LogoConfig = {
  src: string; // 로고 이미지 경로(내부 "/..." 또는 https://...)
  alt: string; // 대체 텍스트(접근성·SEO)
};

export const DEFAULT_LOGO: LogoConfig = {
  src: "/images/logo_black.png",
  alt: "WORKUP",
};

// safeHref 는 "/", "#", http(s):, tel:, mailto: 만 통과시킨다.
// 로고는 내부 경로(/) 또는 업로드된 https 이미지(ImageKit)만 유효하므로 그대로 재사용한다.
export function normalizeLogo(raw: Partial<LogoConfig> | null | undefined): LogoConfig {
  const c = raw ?? {};
  const src = typeof c.src === "string" ? safeHref(c.src) : "";
  const alt = typeof c.alt === "string" && c.alt.trim() ? c.alt.trim() : DEFAULT_LOGO.alt;
  return { src: src || DEFAULT_LOGO.src, alt };
}
