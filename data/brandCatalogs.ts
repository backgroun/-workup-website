// 타사 브랜드 PDF 카탈로그 한 건. DB(brand_catalogs) 행과 1:1 매칭.
export type BrandCatalog = {
  id: string;
  brand_name: string;
  pdf_public_id: string;   // ImageKit filePath (페이지 이미지 생성용)
  pdf_file_id: string;     // ImageKit fileId (삭제 시 식별용)
  pdf_url: string;         // 원본 PDF (대체 보기용)
  page_count: number;
  thumbnail_url: string;   // 표지 썸네일 (업로드 시 pg-1 으로 생성)
  sort_order: number;
  is_visible: boolean;
};

export const EMPTY_BRAND_CATALOG: Omit<BrandCatalog, "id"> = {
  brand_name: "",
  pdf_public_id: "",
  pdf_file_id: "",
  pdf_url: "",
  page_count: 0,
  thumbnail_url: "",
  sort_order: 0,
  is_visible: true,
};

// ImageKit PDF 페이지 이미지 URL (N=1..page_count). tr:pg-<n> 변환 + ik-thumbnail 요청.
export function brandPageUrl(urlEndpoint: string, filePath: string, n: number) {
  return `${urlEndpoint}/tr:pg-${n},w-1400,f-auto,q-auto/${filePath}/ik-thumbnail.jpg`;
}

// 표지(1페이지) 썸네일 — 세로 비율로 잘라 사이드바에 표시.
export function brandCoverUrl(urlEndpoint: string, filePath: string) {
  return `${urlEndpoint}/tr:pg-1,w-300,h-420,c-maintain_ratio,f-auto,q-auto/${filePath}/ik-thumbnail.jpg`;
}
