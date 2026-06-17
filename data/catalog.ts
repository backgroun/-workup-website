// 카탈로그(디지털 카탈로그/룩북) 페이지 한 장.
// 사장님이 직접 디자인한 이미지 + 선택적 제목/설명/링크로 구성된다.
// DB(snake_case) 행과 1:1로 매칭 — components/Hero.tsx 의 HeroSlide 패턴과 동일.
export type CatalogPage = {
  id: string;
  admin_title: string;       // 관리 목록 식별용 (실제 화면에는 표시되지 않음)
  image_url: string | null;  // 페이지 이미지 (Cloudinary)
  title: string;             // 이미지 위 캡션 제목 (선택)
  description: string;       // 캡션 설명 (선택)
  link_url: string;          // 클릭 시 이동할 주소 (선택, 예: /products/xxx · /store)
  link_label: string;        // 링크 버튼 문구 (선택, 예: "매장에서 보기")
  is_visible: boolean;       // 노출 여부
  sort_order: number;        // 페이지 순서
};

// 신규 페이지 기본값 (관리 폼에서 사용)
export const EMPTY_CATALOG_PAGE: Omit<CatalogPage, "id"> = {
  admin_title: "",
  image_url: "",
  title: "",
  description: "",
  link_url: "",
  link_label: "",
  is_visible: true,
  sort_order: 0,
};
