import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";

// site_settings 테이블에서 섹션 config(JSON)를 조회한다.
// 관리자 수정이 즉시 반영되도록 noStore()로 항상 최신을 읽는다. 실패 시 null.
export async function getSiteSection<T>(section: string): Promise<T | null> {
  noStore();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", section)
      .maybeSingle();
    return (data?.config as T) ?? null;
  } catch {
    return null;
  }
}
