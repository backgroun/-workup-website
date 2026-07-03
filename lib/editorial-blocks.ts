import { createAdminClient } from "@/lib/supabase-server";
import { editorials } from "@/data/editorial";
import { productDisplayName } from "@/data/products";
import type { Editorial, EditorialSection, EditorialSectionItem } from "@/data/editorial";

// ── DB 원본 타입 ──────────────────────────────────────────────
export type HeroTag = { id: string; x: number; y: number; pc_x?: number; pc_y?: number; name: string; price: string; product_id: string; image_url: string; bg: string };
export type ProductItem = { id: string; product_id: string; name: string; price: string; image_url: string; bg: string };
export type Banner = {
  title: string; desc: string; section_bg: string; image_url: string;
  label?: string;               // 상세페이지 상단 라벨 (배너별 기획전명)
  items: ProductItem[];
  detail_items?: ProductItem[]; // 상세페이지 전용 추가 상품
  tags?: HeroTag[];
};
export type DBBlock = {
  id: string; sort_order: number; is_visible: boolean; reversed: boolean;
  hero: { title: string; subtitle: string; hero_subtitle: string; desc: string; bg_color: string; image_url: string; image_position?: string; link: string; tags: HeroTag[] };
  banner1: Banner; banner2: Banner; banner3?: Banner; banner4?: Banner;
};

// ── DB 조회 ───────────────────────────────────────────────────
async function fetchBlocks(): Promise<DBBlock[] | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "editorial_blocks")
      .maybeSingle();

    const raw = data?.config;
    const blockList: DBBlock[] | null =
      Array.isArray(raw) ? raw :
      (raw?.blocks && Array.isArray(raw.blocks)) ? raw.blocks :
      null;
    return blockList && blockList.length > 0 ? blockList : null;
  } catch {
    return null;
  }
}

// ── 매핑 헬퍼 ─────────────────────────────────────────────────
function mapItems(items?: ProductItem[]): EditorialSectionItem[] {
  return (items ?? [])
    .filter((i) => i.product_id || i.name)
    .map((i) => ({
      productId: i.product_id || "",
      name: i.name || "",
      price: i.price || "",
      bg: i.bg || "#f0f0f0",
      imageUrl: i.image_url || undefined,
    }));
}

function makeSection(banner: Banner | undefined, detailHref?: string): EditorialSection {
  const pad: EditorialSectionItem = { productId: "", name: "", price: "", bg: "#f0f0f0" };
  const items = mapItems(banner?.items);
  while (items.length < 3) items.push(pad);
  const detailItems = mapItems(banner?.detail_items);
  const tags = (banner?.tags ?? [])
    .filter((t) => t.product_id)
    .map((t) => ({ x: t.x, y: t.y, name: t.name || "", price: t.price || "", productId: t.product_id, imageUrl: t.image_url || undefined }));
  return {
    sectionBg: banner?.section_bg || "#1A2B4A",
    title: banner?.title || "",
    desc: banner?.desc || "",
    imageUrl: banner?.image_url || undefined,
    items: [items[0], items[1], items[2]],
    detailItems,
    detailHref,
    tags,
  };
}

export function blockToEditorial(block: DBBlock): Editorial {
  const href = (n: number) => `/products/feature/${block.id}/${n}`;
  const s1 = makeSection(block.banner1, href(1));
  const s2 = makeSection(block.banner2, href(2));
  const s3 = block.banner3 ? makeSection(block.banner3, href(3)) : s1;
  const s4 = block.banner4 ? makeSection(block.banner4, href(4)) : s2;

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
      x: t.x, y: t.y, pcX: t.pc_x, pcY: t.pc_y,
      name: t.name, price: t.price, productId: t.product_id,
      bg: t.bg || "#1A2B4A", imageUrl: t.image_url || undefined,
    })),
    sections: [s1, s2, s3, s4],
  };
}

// ── 홈 에디토리얼 목록 ────────────────────────────────────────
export async function getHomeEditorials(): Promise<{ editorial: Editorial; reversed: boolean }[]> {
  const blockList = await fetchBlocks();
  if (blockList) {
    const blocks = blockList
      .filter((b) => b.is_visible !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    if (blocks.length > 0) {
      return blocks.map((b) => ({ editorial: blockToEditorial(b), reversed: b.reversed ?? false }));
    }
  }
  return editorials.map((ed, i) => ({ editorial: ed, reversed: i % 2 === 1 }));
}

// ── 배너별 상세페이지 데이터 ──────────────────────────────────
export type DetailProduct = EditorialSectionItem & { displayName: string };
export type BannerDetail = {
  blockId: string;
  bannerIndex: number;
  editorialTitle: string;      // 상위 기획전(블록) 제목 — 메타용
  label: string;               // 상단 라벨 (배너별 기획전명, 없으면 블록 제목 폴백)
  title: string;
  desc: string;
  imageUrl?: string;           // 배너 섹션 이미지
  bg: string;
  products: DetailProduct[];   // 메인 items + detail_items 합본 (브랜드 접두 포함)
};

// 상품 id → 브랜드 정보 조회 (제품명 앞 "[브랜드]" 접두용)
async function fetchBrandMap(ids: string[]): Promise<Record<string, { brand?: string; hide: boolean }>> {
  const map: Record<string, { brand?: string; hide: boolean }> = {};
  const valid = ids.filter(Boolean);
  if (valid.length === 0) return map;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select("id, brand, hide_brand_prefix")
      .in("id", valid);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data ?? []).forEach((r: any) => {
      map[r.id] = { brand: r.brand ?? undefined, hide: r.hide_brand_prefix ?? false };
    });
  } catch {
    // 조회 실패 시 브랜드 없이 진행
  }
  return map;
}

export async function getBannerDetail(blockId: string, bannerIndex: number): Promise<BannerDetail | null> {
  if (bannerIndex < 1 || bannerIndex > 4) return null;
  const blockList = await fetchBlocks();
  if (!blockList) return null;
  const block = blockList.find((b) => b.id === blockId);
  if (!block || block.is_visible === false) return null;

  const banner = [block.banner1, block.banner2, block.banner3, block.banner4][bannerIndex - 1];
  if (!banner) return null;

  const merged = [...mapItems(banner.items), ...mapItems(banner.detail_items)]
    // 중복 상품(productId 기준) 제거 — 메인/추가에 같은 상품이 들어간 경우
    .filter((p, i, arr) => !p.productId || arr.findIndex((q) => q.productId === p.productId) === i);

  // 브랜드 접두명 구성 — 제품 DB에서 brand/hide_brand_prefix 조회
  const brandMap = await fetchBrandMap(merged.map((p) => p.productId));
  const products: DetailProduct[] = merged.map((p) => {
    const b = brandMap[p.productId];
    return { ...p, displayName: productDisplayName({ name: p.name, brand: b?.brand, hideBrandPrefix: b?.hide }) };
  });

  return {
    blockId: block.id,
    bannerIndex,
    editorialTitle: block.hero?.title || "",
    label: banner.label?.trim() || block.hero?.title || "",
    title: banner.title || "",
    desc: banner.desc || "",
    imageUrl: banner.image_url || undefined,
    bg: banner.section_bg || "#1A2B4A",
    products,
  };
}
