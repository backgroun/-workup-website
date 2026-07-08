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

/**
 * 상대경로·저장소 경로를 검색엔진이 인식하는 절대 URL로 변환.
 * 이미 http(s)로 시작하면 그대로 반환. 빈 값은 undefined.
 * OG 이미지·구조화 데이터(JSON-LD)에서 이미지/링크를 절대경로로 만들 때 사용.
 */
export function absoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}
