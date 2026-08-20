import { getSiteSection } from "@/lib/site-settings";
import { buildDefaultBrands, DEFAULT_MEGA_SETTINGS } from "@/lib/mega-brands-defaults";
import type { MegaBrandsConfig, MegaBrandItem } from "@/lib/mega-brands-types";
import { createAdminClient } from "@/lib/supabase-server";

async function getBrandsFromDb(): Promise<MegaBrandItem[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data?.length) return null;
    return data.map((b) => ({
      id: b.id,
      name: b.name,
      positioning: b.positioning,
      descriptionKo: b.name_ko ?? "",
      description: b.description,
      accentColor: b.accent_color,
      href: `/brands/${b.id}`,
      megaMenuImage: b.mega_menu_image ?? "",
      megaMenuImageX: b.mega_menu_image_x ?? 50,
      megaMenuImageY: b.mega_menu_image_y ?? 30,
      megaMenuVisible: b.mega_menu_visible ?? true,
      brandPageVisible: b.brand_page_visible ?? true,
      status: "active" as const,
      sortOrder: b.sort_order ?? 0,
    }));
  } catch {
    return null;
  }
}

export async function getMegaBrandsConfig(): Promise<MegaBrandsConfig> {
  const [dbBrands, saved] = await Promise.all([
    getBrandsFromDb(),
    getSiteSection<MegaBrandsConfig>("mega_menu_brands"),
  ]);

  const brands = dbBrands ?? saved?.brands ?? buildDefaultBrands();
  const settings = saved?.settings ?? DEFAULT_MEGA_SETTINGS;

  return { brands, settings };
}
