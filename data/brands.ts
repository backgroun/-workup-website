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
};
