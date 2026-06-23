import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";

export type DesignAsset = {
  id: string;
  url: string;
  label: string;
};

export type StudioSettings = {
  enabled: boolean;
  heading: string;
  subheading: string;
  shirtImageUrl: string;   // 관리자가 올린 커스텀 티셔츠 배경 이미지 (없으면 SVG 사용)
  defaultColor: string;
  enabledColors: string[]; // 빈 배열 = 전체 활성
  designs: DesignAsset[];  // 관리자가 올린 프리셋 디자인 소스
};

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  enabled: true,
  heading: "나만의 티셔츠 꾸미기",
  subheading: "사진·이미지를 올리고 텍스트를 더해 디자인하고, 매장에서 제작 상담받아 보세요.",
  shirtImageUrl: "",
  defaultColor: "teal",
  enabledColors: [],
  designs: [],
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
        heading: typeof raw.heading === "string" && raw.heading ? raw.heading : DEFAULT_STUDIO_SETTINGS.heading,
        subheading: typeof raw.subheading === "string" ? raw.subheading : DEFAULT_STUDIO_SETTINGS.subheading,
        shirtImageUrl: typeof raw.shirtImageUrl === "string" ? raw.shirtImageUrl : DEFAULT_STUDIO_SETTINGS.shirtImageUrl,
        defaultColor:
          typeof raw.defaultColor === "string" && raw.defaultColor
            ? raw.defaultColor
            : DEFAULT_STUDIO_SETTINGS.defaultColor,
        enabledColors: Array.isArray(raw.enabledColors) ? raw.enabledColors : DEFAULT_STUDIO_SETTINGS.enabledColors,
        designs: Array.isArray(raw.designs) ? raw.designs : DEFAULT_STUDIO_SETTINGS.designs,
      };
    } catch {
      return DEFAULT_STUDIO_SETTINGS;
    }
  },
  ["studio_settings"],
  { revalidate: 60, tags: ["studio_settings"] }
);
