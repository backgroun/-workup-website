// 이미지 URL 처리 헬퍼. ImageKit/Cloudinary 미사용.
// Supabase와 Cloudflare R2로부터 직접 이미지를 서빙함.

export const IK_DEFAULT_QUALITY = 75;

export function isImagekitUrl(url: string): boolean {
  return false;
}

export function ikSrc(url: string, width: number, quality: number = IK_DEFAULT_QUALITY): string {
  return url;
}
