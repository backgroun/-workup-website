import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";

export type HeroSlide = {
  id: string;
  season_text: string;
  title: string;
  subtitle: string;
  btn1_text: string;
  btn1_link: string;
  btn1_visible: boolean;
  btn2_text: string;
  btn2_link: string;
  btn2_visible: boolean;
  pc_image_url: string | null;
  mobile_image_url: string | null;
  pc_video_url?: string | null;
  mobile_video_url?: string | null;
  pc_image_position?: string | null;
  mobile_image_position?: string | null;
  pc_image_scale?: number | null;
  mobile_image_scale?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text_layers?: any[] | null;
  content_x?: number | null;
  content_y?: number | null;
  is_visible: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  sort_order: number;
};

// 히어로 슬라이드를 hero_slides 테이블에서 읽는다.
// 홈(전역)에서 쓰이므로 unstable_cache로 감싸 정적 렌더링을 유지하고,
// 관리자 저장 시 hero-slides API의 revalidateTag("hero_slides")로 즉시 갱신한다.
// 예약 노출(scheduled_start/end)은 캐시 주기(5분) 또는 다음 저장 시점에 반영된다.
export const getActiveSlides = unstable_cache(
  async (slideType: string): Promise<HeroSlide[]> => {
    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_visible", true)
        .eq("slide_type", slideType)
        .order("sort_order", { ascending: true });
      if (!data || data.length === 0) return [];
      return data.filter((s: HeroSlide) => {
        if (s.scheduled_start && s.scheduled_start > now) return false;
        if (s.scheduled_end && s.scheduled_end < now) return false;
        return true;
      });
    } catch {
      return [];
    }
  },
  ["hero-slides"],
  { tags: ["hero_slides"], revalidate: 300 }
);
