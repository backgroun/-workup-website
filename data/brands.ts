export type Brand = {
  id: string | number;
  name: string;
  name_ko?: string | null;
  positioning?: string;
  description?: string;
  accent_color?: string;
  image_bg?: string;
  mega_menu_image?: string;
  mega_menu_image_x?: number;
  mega_menu_image_y?: number;
  mega_menu_visible?: boolean;
  brand_page_visible?: boolean;
  hero_text_color?: string;
  logo_url?: string;
  logo_text?: string;
  sort_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
  // ── 카탈로그 관련 ──
  catalog_enabled?: boolean;           // 조립형 카탈로그(catalog_pages) 공개 여부
  catalog_cover_url?: string;          // ★ 재사용: 브랜드 목록(/brands) 카드 이미지 (3:2 가로형)
  // 아래 3개는 옛 시스템 잔여 필드 — 현재 미사용 (제거된 brand_catalog_items 시스템)
  catalog_season?: string;
  catalog_headline?: string;
  catalog_intro?: string;
  catalog_tech_images?: string[];
};

export const EMPTY_BRAND: Omit<Brand, "id"> = {
  name: "",
  name_ko: "",
  positioning: "",
  description: "",
  accent_color: "#000000",
  image_bg: "",
  mega_menu_image: "",
  mega_menu_image_x: 50,
  mega_menu_image_y: 30,
  mega_menu_visible: true,
  brand_page_visible: true,
  hero_text_color: "",
  logo_url: "",
  logo_text: "",
  sort_order: 0,
  is_visible: true,
  catalog_enabled: false,
  catalog_cover_url: "",
  catalog_season: "",
  catalog_headline: "",
  catalog_intro: "",
  catalog_tech_images: [],
};
