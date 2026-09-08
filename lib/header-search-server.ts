import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_SEARCH, normalizeSearch, type SearchConfig } from "./header-search";

// 헤더 검색 설정을 site_settings(section="search")에서 읽는다.
// 저장 시 site-settings PUT 의 revalidateTag("search")로 즉시 갱신한다.
const getSearchConfigCached = unstable_cache(
  async (): Promise<SearchConfig> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "search")
      .maybeSingle();
    return normalizeSearch(data?.config as Partial<SearchConfig> | null);
  },
  ["search-config"],
  { tags: ["search"], revalidate: 300 }
);

export async function getSearchConfig(): Promise<SearchConfig> {
  try {
    return await getSearchConfigCached();
  } catch {
    return DEFAULT_SEARCH;
  }
}
