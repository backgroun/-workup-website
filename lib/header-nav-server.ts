import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_HEADER_NAV, normalizeHeaderNav, type HeaderNavConfig } from "./header-nav";

// 헤더 메뉴 설정을 site_settings(section="header-nav")에서 읽는다.
// topbar 와 동일하게 unstable_cache 로 감싸 정적 렌더링을 유지하고,
// 관리자가 저장하면 site-settings PUT 핸들러가 revalidateTag("header-nav")로 즉시 갱신한다.
export const getHeaderNavConfig = unstable_cache(
  async (): Promise<HeaderNavConfig> => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("site_settings")
        .select("config")
        .eq("section", "header-nav")
        .maybeSingle();
      return normalizeHeaderNav(data?.config as Partial<HeaderNavConfig> | null);
    } catch {
      return DEFAULT_HEADER_NAV;
    }
  },
  ["header-nav-config"],
  { tags: ["header-nav"], revalidate: 300 }
);
