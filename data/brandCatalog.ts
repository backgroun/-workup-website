// 브랜드별 조립형 카탈로그 — DB(brand_catalog_items) 행과 snake_case 1:1.
// 메타(커버·시즌·인트로·공용 기술서)는 brands 테이블의 catalog_* 컬럼에 있다.

export type CatalogSpec = { label: string; value: string };

export type CatalogColorVariant = {
  key: string;         // 해시 딥링크 슬러그, 항목 내 유일 (예: "black")
  label: string;       // 표시명 (예: "블랙")
  swatch?: string;     // 색상칩 hex (선택)
  cutout_url: string;  // 누끼컷 — 컬러 칩 썸네일
  styled_url: string;  // 착장컷 — 선택 시 큰 이미지. 비면 cutout_url 사용
  gallery?: string[];  // 추가 이미지 (선택)
};

export type BrandCatalogItem = {
  id: string;
  brand_id: string;
  sort_order: number;
  is_visible: boolean;
  category: string;
  name: string;
  summary: string;
  description: string;
  price: string;
  specs: CatalogSpec[];
  colors: CatalogColorVariant[];
  tech_images: string[];
};

export type BrandCatalogMeta = {
  enabled: boolean;
  cover_url: string;
  season: string;
  headline: string;
  intro: string;
  tech_images: string[];
};

export const EMPTY_CATALOG_ITEM: Omit<BrandCatalogItem, "id" | "brand_id"> = {
  sort_order: 0,
  is_visible: true,
  category: "",
  name: "",
  summary: "",
  description: "",
  price: "",
  specs: [],
  colors: [],
  tech_images: [],
};

export const EMPTY_COLOR_VARIANT: CatalogColorVariant = {
  key: "",
  label: "",
  swatch: "",
  cutout_url: "",
  styled_url: "",
  gallery: [],
};

// 라벨 → 유일한 슬러그. 영문/숫자화 후 이미 쓰인 key면 -2, -3… 접미사.
export function slugifyColorKey(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "") || "color";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function catalogItemAnchor(itemId: string): string {
  return `item-${itemId}`;
}

export function catalogColorAnchor(itemId: string, colorKey: string): string {
  return `item-${itemId}-${colorKey}`;
}

export type CatalogTocGroup = { category: string; items: { id: string; name: string }[] };

// category가 있는 항목은 그 이름으로 그룹, 없으면 "제품". 순서는 items 순서 유지.
export function buildCatalogToc(items: BrandCatalogItem[]): CatalogTocGroup[] {
  const groups: CatalogTocGroup[] = [];
  for (const it of items) {
    const cat = it.category.trim() || "제품";
    let g = groups.find((x) => x.category === cat);
    if (!g) {
      g = { category: cat, items: [] };
      groups.push(g);
    }
    g.items.push({ id: it.id, name: it.name || "(이름 없음)" });
  }
  return groups;
}
