// ImageKit URL에 리사이즈·포맷 변환 쿼리를 부여해 트래픽을 줄인다.
// 원본(최대 1600px)을 그대로 전송하던 것을, 표시 크기에 맞춰 축소 + WebP/AVIF 자동 선택(f-auto)한다.
// ImageKit이 아닌 URL(로컬 /images, data:, Supabase 등)은 그대로 반환한다.
const IMAGEKIT_HOST = "ik.imagekit.io";

export function ikResize(url: string | null | undefined, width: number, quality = 80): string {
  if (!url) return url ?? "";
  try {
    const u = new URL(url);
    if (!u.hostname.includes(IMAGEKIT_HOST)) return url;
    u.searchParams.set("tr", `w-${width},q-${quality},f-auto`);
    return u.toString();
  } catch {
    return url;
  }
}
