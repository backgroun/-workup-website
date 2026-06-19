import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";

export type StudioSettings = {
  enabled: boolean;
  defaultColor: string;
  enabledColors: string[]; // 빈 배열 = 전체 활성
};

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  enabled: true,
  defaultColor: "teal",
  enabledColors: [],
};

export const getStudioSettings = unstable_cache(
  async (): Promise<StudioSettings> => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("site_settings")
        .select("config")
        .eq("section", "studio_settings")
        .maybeSingle();
      const raw = data?.config as Partial<StudioSettings> | null;
      if (!raw) return DEFAULT_STUDIO_SETTINGS;
      return {
        enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_STUDIO_SETTINGS.enabled,
        defaultColor:
          typeof raw.defaultColor === "string" && raw.defaultColor
            ? raw.defaultColor
            : DEFAULT_STUDIO_SETTINGS.defaultColor,
        enabledColors: Array.isArray(raw.enabledColors)
          ? raw.enabledColors
          : DEFAULT_STUDIO_SETTINGS.enabledColors,
      };
    } catch {
      return DEFAULT_STUDIO_SETTINGS;
    }
  },
  ["studio_settings"],
  { revalidate: 60, tags: ["studio_settings"] }
);
