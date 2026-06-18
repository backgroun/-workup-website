import { createAdminClient } from "@/lib/supabase-server";
import FeatureHeroLayout from "@/components/FeatureHeroLayout";
import { editorials } from "@/data/editorial";
import type { Editorial, EditorialSection, EditorialSectionItem } from "@/data/editorial";

type HeroTag = { id: string; x: number; y: number; pc_x?: number; pc_y?: number; name: string; price: string; product_id: string; image_url: string; bg: string };
type ProductItem = { id: string; product_id: string; name: string; price: string; image_url: string; bg: string };
type Banner = { title: string; desc: string; section_bg: string; image_url: string; items: ProductItem[]; tags?: HeroTag[] };
type DBBlock = {
  id: string; sort_order: number; is_visible: boolean; reversed: boolean;
  hero: { title: string; subtitle: string; hero_subtitle: string; desc: string; bg_color: string; image_url: string; image_position?: string; link: string; tags: HeroTag[] };
  banner1: Banner; banner2: Banner; banner3?: Banner; banner4?: Banner;
};

function blockToEditorial(block: DBBlock): Editorial {
  const makeSection = (banner: Banner): EditorialSection => {
    const pad: EditorialSectionItem = { productId: "", name: "", price: "", bg: "#f0f0f0" };
    const items: EditorialSectionItem[] = (banner?.items ?? []).map((i) => ({
      productId: i.product_id || "",
      name: i.name || "",
      price: i.price || "",
      bg: i.bg || "#f0f0f0",
      imageUrl: i.image_url || undefined,
    }));
    while (items.length < 3) items.push(pad);
    const tags = (banner?.tags ?? [])
      .filter((t) => t.product_id)
      .map((t) => ({
        x: t.x,
        y: t.y,
        name: t.name || "",
        price: t.price || "",
        productId: t.product_id,
        imageUrl: t.image_url || undefined,
      }));
    return {
      sectionBg: banner?.section_bg || "#1A2B4A",
      title: banner?.title || "",
      desc: banner?.desc || "",
      imageUrl: banner?.image_url || undefined,
      items: [items[0], items[1], items[2]],
      tags,
    };
  };

  const s1 = makeSection(block.banner1);
  const s2 = makeSection(block.banner2);
  const s3 = block.banner3 ? makeSection(block.banner3) : s1;
  const s4 = block.banner4 ? makeSection(block.banner4) : s2;

  return {
    slug: block.id,
    badge: "",
    title: block.hero?.title || "",
    subtitle: block.hero?.subtitle || "",
    desc: block.hero?.desc || "",
    bg: block.hero?.bg_color || "#1A2B4A",
    heroImageUrl: block.hero?.image_url || undefined,
    heroImagePosition: block.hero?.image_position || undefined,
    textAccent: "#ff550c",
    heroSubtitle: block.hero?.hero_subtitle || "",
    tags: (block.hero?.tags ?? []).map((t) => ({
      x: t.x,
      y: t.y,
      pcX: t.pc_x,
      pcY: t.pc_y,
      name: t.name,
      price: t.price,
      productId: t.product_id,
      bg: t.bg || "#1A2B4A",
      imageUrl: t.image_url || undefined,
    })),
    sections: [s1, s2, s3, s4],
  };
}

async function getItems(): Promise<{ editorial: Editorial; reversed: boolean }[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "editorial_blocks")
      .maybeSingle();

    const raw = data?.config;
    // 어드민은 { blocks: [...] } 형태로 저장, 이전 포맷 배열 직접 저장 모두 지원
    const blockList: DBBlock[] | null =
      Array.isArray(raw) ? raw :
      (raw?.blocks && Array.isArray(raw.blocks)) ? raw.blocks :
      null;

    if (blockList && blockList.length > 0) {
      const blocks = blockList
        .filter((b) => b.is_visible !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      if (blocks.length > 0) {
        return blocks.map((b) => ({ editorial: blockToEditorial(b), reversed: b.reversed ?? false }));
      }
    }
  } catch {
    // fallback
  }
  return editorials.map((ed, i) => ({ editorial: ed, reversed: i % 2 === 1 }));
}

export default async function HomeEditorial() {
  const items = await getItems();
  return (
    <section>
      {items.map(({ editorial, reversed }, i) => (
        <FeatureHeroLayout key={editorial.slug || i} editorial={editorial} reversed={reversed} />
      ))}
    </section>
  );
}
