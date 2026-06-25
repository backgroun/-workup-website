import { createAdminClient } from "./supabase-server";
import { normalizeTopbar, type TopbarConfig } from "./topbar";

export async function getTopbarConfig(): Promise<TopbarConfig> {
  try {
    const { data } = await createAdminClient()
      .from("site_settings")
      .select("config")
      .eq("section", "topbar")
      .maybeSingle();
    return normalizeTopbar(data?.config as Partial<TopbarConfig> | null);
  } catch {
    return normalizeTopbar(null);
  }
}
