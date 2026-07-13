// ImageKit URL 전송량 절감 헬퍼.
// 원본(장당 수 MB)을 그대로 내보내면 ImageKit 대역폭이 순식간에 소진되므로,
// ik.imagekit.io URL에 리사이즈·품질·포맷 변환 파라미터(tr=)를 붙여
// 화면에 필요한 크기만 전송한다. 그 외 URL(수파베이스·데이터URI 등)은 그대로 통과.
//
// - <img> 태그: ikSrc(url, 폭) 으로 직접 감싼다.
// - next/image: lib/imagekit-loader.ts 가 동일 규칙을 자동 적용하므로 손댈 필요 없다.

const IMAGEKIT_ORIGIN = "https://ik.imagekit.io/";

export const IK_DEFAULT_QUALITY = 75;

export function isImagekitUrl(url: string): boolean {
  return url.startsWith(IMAGEKIT_ORIGIN);
}

/**
 * ImageKit URL에 w(폭)·q(품질)·f-auto(WebP/AVIF 자동) 변환을 붙인다.
 * 이미 tr 파라미터가 있는 URL과 ImageKit 외 URL은 원본 그대로 반환.
 */
export function ikSrc(url: string, width: number, quality: number = IK_DEFAULT_QUALITY): string {
  if (!isImagekitUrl(url)) return url;
  // 이미 변환이 지정된 URL은 중복 적용하지 않는다 (쿼리형 ?tr= / 경로형 /tr: 모두)
  if (/[?&]tr=/.test(url) || url.includes("/tr:")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tr=w-${width},q-${quality},f-auto`;
}
