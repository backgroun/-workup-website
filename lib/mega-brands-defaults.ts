import { BRANDS } from "@/lib/brands-data";
import type { MegaBrandItem, MegaMenuSettings } from "@/lib/mega-brands-types";

export const DEFAULT_MEGA_SETTINGS: MegaMenuSettings = {
  heading: "OUR BRANDS",
  body: "모든 워커를 위한\n매일 입는 워크업",
  ctaLabel: "브랜드 전체 보기 →",
  ctaUrl: "/catalog",
  enabled: true,
};

export function buildDefaultBrands(): MegaBrandItem[] {
  return BRANDS.map((b, i) => ({
    id: b.id,
    name: b.name,
    positioning: b.positioning,
    descriptionKo: b.descriptionKo,
    description: b.description,
    accentColor: b.accentColor,
    href: b.href,
    megaMenuImage: "",
    megaMenuImageX: 50,
    megaMenuImageY: 30,
    megaMenuVisible: true,
    brandPageVisible: true,
    status: "active" as const,
    sortOrder: i,
  }));
}
