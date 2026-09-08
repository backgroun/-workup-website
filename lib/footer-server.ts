import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_FOOTER, normalizeFooter, type FooterConfig } from "./site-content";

// 푸터 설정을 site_settings(section="footer")에서 읽는다.
// 루트 레이아웃(전역)에서 쓰이므로 unstable_cache로 감싸 정적 렌더링을 유지하고,
// 저장 시 site-settings PUT 의 revalidateTag("footer")로 즉시 갱신한다.
const getFooterConfigCached = unstable_cache(
  async (): Promise<FooterConfig> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "footer")
      .maybeSingle();
    return normalizeFooter(data?.config as Partial<FooterConfig> | null);
  },
  ["footer-config"],
  { tags: ["footer"], revalidate: 300 }
);

export async function getFooterConfig(): Promise<FooterConfig> {
  try {
    return await getFooterConfigCached();
  } catch {
    return DEFAULT_FOOTER;
  }
}
