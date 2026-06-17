import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_TOPBAR, normalizeTopbar, type TopbarConfig } from "./topbar";

// 탑바 설정을 site_settings(section="topbar")에서 읽는다.
// unstable_cache 로 감싸 일반 페이지의 정적 렌더링을 유지(매 요청 DB 조회 방지)하고,
// 관리자가 저장하면 site-settings PUT 핸들러가 revalidateTag("topbar")로 즉시 갱신한다.
export const getTopbarConfig = unstable_cache(
  async (): Promise<TopbarConfig> => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("site_settings")
        .select("config")
        .eq("section", "topbar")
        .maybeSingle();
      return normalizeTopbar(data?.config as Partial<TopbarConfig> | null);
    } catch {
      return DEFAULT_TOPBAR;
    }
  },
  ["topbar-config"],
  { tags: ["topbar"], revalidate: 300 }
);
