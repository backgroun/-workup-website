// next/image 커스텀 로더 (next.config.ts images.loaderFile 에서 참조).
//
// - ik.imagekit.io 이미지: ImageKit 자체 변환(tr=w,q,f-auto)으로 직접 서빙.
//   → Vercel 이미지 최적화(Image Transformation 과금)를 거치지 않고,
//     ImageKit이 요청 폭에 맞는 WebP/AVIF 축소본만 전송해 대역폭을 크게 줄인다.
// - 그 외(로컬 public 자산·레거시 외부 URL): 원본 그대로 서빙.
//   loaderFile 사용 시 Next의 /_next/image 최적화 엔드포인트가 비활성화되므로
//   (검증 완료: 404), 폴백은 원본 통과가 유일하게 안전한 동작이다.
//   실제 이미지 트래픽은 전부 ImageKit이라 영향은 로고·아이콘 수준.
//
// 주의: 클라이언트 번들에 포함되므로 외부 import 없이 순수 함수로 유지한다.

const IMAGEKIT_ORIGIN = "https://ik.imagekit.io/";

export default function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith(IMAGEKIT_ORIGIN)) {
    // 이미 변환이 붙은 URL은 그대로 사용 (중복 변환 방지)
    if (/[?&]tr=/.test(src) || src.includes("/tr:")) return src;
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}tr=w-${width},q-${quality ?? 75},f-auto`;
  }
  return src;
}
