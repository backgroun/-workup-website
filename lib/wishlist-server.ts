import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_WISHLIST, normalizeWishlist, type WishlistConfig } from "./wishlist";

// 찜(피팅 리스트) 페이지 설정을 site_settings(section="wishlist")에서 읽는다.
// 저장 시 site-settings PUT 의 revalidateTag("wishlist")로 즉시 갱신한다.
const getWishlistConfigCached = unstable_cache(
  async (): Promise<WishlistConfig> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "wishlist")
      .maybeSingle();
    return normalizeWishlist(data?.config as Partial<WishlistConfig> | null);
  },
  ["wishlist-config"],
  { tags: ["wishlist"], revalidate: 300 }
);

export async function getWishlistConfig(): Promise<WishlistConfig> {
  try {
    return await getWishlistConfigCached();
  } catch {
    return DEFAULT_WISHLIST;
  }
}
