import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/data/products";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// DB row (snake_case) → Product (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFromDb(row: any): Product {
  return {
    id: row.id,
    sku: row.sku ?? undefined,
    brand: row.brand ?? undefined,
    hideBrandPrefix: row.hide_brand_prefix ?? false,
    manufacturer: row.manufacturer ?? undefined,
    origin: row.origin ?? undefined,
    name: row.name,
    line: row.line,
    category: row.category,
    subCategory: row.sub_category,
    categories: row.categories ?? undefined,
    status: row.status ?? "판매중",
    isNew: row.is_new ?? false,
    tagline: row.tagline ?? "",
    price: row.price ?? "",
    consumerPrice: row.consumer_price ?? undefined,
    supplyPrice: row.supply_price ?? undefined,
    features: row.features ?? [],
    featureTags: row.feature_tags ?? [],
    jobTypes: row.job_types ?? [],
    jobSites: row.job_sites ?? [],
    seasons: row.seasons ?? [],
    promoStart: row.promo_start ?? undefined,
    promoEnd: row.promo_end ?? undefined,
    mainExpose: row.main_expose ?? [],
    fieldTest: row.field_test ?? undefined,
    wearerQuote: row.wearer_quote ?? undefined,
    bg: row.bg ?? "bg-[#303236]",
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    sizePrices: row.size_prices ?? [],
    // size_guide 컬럼: 배열(신규) 또는 단일 객체(레거시) — 둘 다 수용
    sizeGuide: Array.isArray(row.size_guide) ? (row.size_guide[0] ?? undefined) : (row.size_guide ?? undefined),
    sizeGuides: Array.isArray(row.size_guide) ? row.size_guide : (row.size_guide ? [row.size_guide] : undefined),
    detailInfo: row.detail_info ?? [],
    imageUrl: row.image_url ?? undefined,
    subImages: row.sub_images ?? [],
    videoUrl: row.video_url ?? undefined,
    instagramPosts: row.instagram_posts ?? undefined,
    detailBlocks: row.detail_blocks ?? [],
    relatedIds: row.related_ids ?? [],
    metaTitle: row.meta_title ?? undefined,
    metaDesc: row.meta_desc ?? undefined,
    registrationStatus: row.registration_status ?? "정식등록",
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

// Product (camelCase) → DB row (snake_case)
export function mapToDb(p: Partial<Product>) {
  return {
    id: p.id,
    sku: p.sku ?? null,
    brand: p.brand ?? null,
    hide_brand_prefix: p.hideBrandPrefix ?? false,
    manufacturer: p.manufacturer ?? null,
    origin: p.origin ?? null,
    name: p.name,
    line: p.line,
    category: p.category,
    sub_category: p.subCategory,
    categories: p.categories ?? null,
    status: p.status ?? "판매중",
    is_new: p.isNew ?? false,
    tagline: p.tagline ?? "",
    price: p.price ?? "",
    consumer_price: p.consumerPrice ?? null,
    supply_price: p.supplyPrice ?? null,
    features: p.features ?? [],
    feature_tags: p.featureTags ?? [],
    job_types: p.jobTypes ?? [],
    job_sites: p.jobSites ?? [],
    seasons: p.seasons ?? [],
    promo_start: p.promoStart ?? null,
    promo_end: p.promoEnd ?? null,
    main_expose: p.mainExpose ?? [],
    field_test: p.fieldTest ?? null,
    wearer_quote: p.wearerQuote ?? null,
    bg: p.bg ?? "bg-[#303236]",
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    size_prices: p.sizePrices ?? [],
    size_guide: p.sizeGuides ?? (p.sizeGuide ? [p.sizeGuide] : null),
    detail_info: p.detailInfo ?? [],
    image_url: p.imageUrl ?? null,
    sub_images: p.subImages ?? [],
    video_url: p.videoUrl ?? null,
    instagram_posts: p.instagramPosts ?? null,
    detail_blocks: p.detailBlocks ?? [],
    related_ids: p.relatedIds ?? [],
    meta_title: p.metaTitle ?? null,
    meta_desc: p.metaDesc ?? null,
    registration_status: p.registrationStatus ?? "임시등록",
  };
}
