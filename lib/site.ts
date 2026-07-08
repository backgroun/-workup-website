/**
 * 사이트 정식 URL (프로토콜 포함, 끝에 슬래시 없음).
 *
 * 우선순위:
 *  1) NEXT_PUBLIC_SITE_URL      — 커스텀 도메인 연결 시 이 값을 설정하면 최우선 적용
 *  2) VERCEL_PROJECT_PRODUCTION_URL — Vercel이 배포 시 자동 주입하는 프로덕션 도메인
 *  3) http://localhost:3000     — 로컬 개발
 *
 * metadataBase / sitemap / robots 가 모두 이 값을 참조한다.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
