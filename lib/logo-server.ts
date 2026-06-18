import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_LOGO, normalizeLogo, type LogoConfig } from "./logo";

// 로고 설정을 site_settings(section="logo")에서 읽는다.
// 루트 레이아웃(전역)에서 쓰이므로 unstable_cache로 정적 렌더링을 유지하고,
// 저장 시 site-settings PUT 의 revalidateTag("logo")로 즉시 갱신한다.
export const getLogoConfig = unstable_cache(
  async (): Promise<LogoConfig> => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("site_settings")
        .select("config")
        .eq("section", "logo")
        .maybeSingle();
      return normalizeLogo(data?.config as Partial<LogoConfig> | null);
    } catch {
      return DEFAULT_LOGO;
    }
  },
  ["logo-config"],
  { tags: ["logo"], revalidate: 300 }
);
