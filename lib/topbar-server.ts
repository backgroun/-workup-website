import { createAdminClient } from "./supabase-server";
import { DEFAULT_TOPBAR, normalizeTopbar, type TopbarConfig } from "./topbar";

// 캐시 없이 매 요청마다 DB에서 읽는다 — 관리자 저장이 즉시 반영됨.
export async function getTopbarConfig(): Promise<TopbarConfig> {
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
}
