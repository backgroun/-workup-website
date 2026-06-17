// 타사 브랜드 PDF 카탈로그 한 건. DB(brand_catalogs) 행과 1:1 매칭.
export type BrandCatalog = {
  id: string;
  brand_name: string;
  pdf_public_id: string;   // Cloudinary public_id
  pdf_url: string;         // 원본 PDF (대체 보기용)
  page_count: number;
  thumbnail_url: string;   // 표지 썸네일 (업로드 시 pg_1 으로 생성)
  sort_order: number;
  is_visible: boolean;
};

export const EMPTY_BRAND_CATALOG: Omit<BrandCatalog, "id"> = {
  brand_name: "",
  pdf_public_id: "",
  pdf_url: "",
  page_count: 0,
  thumbnail_url: "",
  sort_order: 0,
  is_visible: true,
};

// Cloudinary PDF 페이지 이미지 URL (N=1..page_count). pg_<n> 변환 + f_auto/q_auto.
export function brandPageUrl(cloud: string, publicId: string, n: number) {
  return `https://res.cloudinary.com/${cloud}/image/upload/pg_${n},w_1400,f_auto,q_auto/${publicId}.jpg`;
}

// 표지(1페이지) 썸네일 — 세로 비율로 잘라 사이드바에 표시.
export function brandCoverUrl(cloud: string, publicId: string) {
  return `https://res.cloudinary.com/${cloud}/image/upload/pg_1,c_fill,w_300,h_420,f_auto,q_auto/${publicId}.jpg`;
}
