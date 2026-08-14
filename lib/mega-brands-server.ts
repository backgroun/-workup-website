import { getSiteSection } from "@/lib/site-settings";
import { buildDefaultBrands, DEFAULT_MEGA_SETTINGS } from "@/lib/mega-brands-defaults";
import type { MegaBrandsConfig } from "@/lib/mega-brands-types";

export async function getMegaBrandsConfig(): Promise<MegaBrandsConfig> {
  const saved = await getSiteSection<MegaBrandsConfig>("mega_menu_brands");
  if (saved?.brands?.length && saved?.settings) return saved;
  return { brands: buildDefaultBrands(), settings: DEFAULT_MEGA_SETTINGS };
}
