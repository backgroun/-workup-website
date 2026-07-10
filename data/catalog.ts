// 카탈로그(디지털 카탈로그/룩북) 페이지 한 장.
// 종류(page_type): image(직접 업로드 이미지) · cover(표지) · contents(목차) · divider(카테고리 구분)
// cover/contents/divider 는 옛 플립북 디자인을 코드로 재현하며, 내용은 data(JSONB)에 담는다.
// DB(snake_case) 행과 1:1로 매칭 — components/Hero.tsx 의 HeroSlide 패턴과 동일.

export type CatalogPageType = "image" | "cover" | "contents" | "divider";

export type ContentsItem = { name: string; count: string; page: string };

// 종류별 내용 (cover/contents/divider). image 페이지는 비어 있음({}).
export type CatalogPageData = {
  eyebrow?: string;            // 상단 영문 라벨 (cover/contents/divider 공통)
  bg?: string;                 // 배경색 hex (cover/divider)
  // cover (표지)
  season?: string; brand?: string; badge?: string; note?: string; code?: string;
  // contents (목차)
  items?: ContentsItem[]; footer?: string;
  // divider (구분)
  no?: string; title?: string; desc?: string; count?: string;
};

export type CatalogPage = {
  id: string;
  page_type: CatalogPageType;
  admin_title: string;       // 관리 목록 식별용 (실제 화면에는 표시되지 않음)
  image_url: string | null;  // 페이지 이미지 (image 종류)
  title: string;             // 이미지 위 캡션 제목 (image 종류, 선택)
  description: string;       // 캡션 설명 (image 종류, 선택)
  link_url: string;          // 클릭 시 이동 (image 종류, 선택)
  link_label: string;        // 링크 버튼 문구 (image 종류, 선택)
  data: CatalogPageData;     // cover/contents/divider 내용
  is_visible: boolean;
  sort_order: number;
};

export const CATALOG_TYPE_LABEL: Record<CatalogPageType, string> = {
  image: "이미지",
  cover: "표지",
  contents: "목차",
  divider: "구분",
};

// 신규 페이지 기본값 (관리 폼에서 사용)
export const EMPTY_CATALOG_PAGE: Omit<CatalogPage, "id"> = {
  page_type: "image",
  admin_title: "",
  image_url: "",
  title: "",
  description: "",
  link_url: "",
  link_label: "",
  data: {},
  is_visible: true,
  sort_order: 0,
};

// 종류 선택 시 채워줄 기본 내용 (옛 플립북 값 기준)
export function emptyDataFor(type: CatalogPageType): CatalogPageData {
  switch (type) {
    case "cover":
      return { eyebrow: "Product Catalog", season: "2026 Spring / Summer", brand: "WORKUP", badge: "2026 SS", note: "", code: "Cat. WU-2026-SS-001", bg: "#303236" };
    case "contents":
      return { eyebrow: "Contents", items: [{ name: "", count: "", page: "" }], footer: "WORKUP 2026 SS CATALOG" };
    case "divider":
      return { eyebrow: "Category 01", no: "01", title: "", desc: "", count: "", bg: "#303236" };
    default:
      return {};
  }
}
