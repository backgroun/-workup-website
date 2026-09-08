import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase-server";
import { DEFAULT_PR_ROOM, normalizePrRoom, type PrRoomConfig } from "./pr-room";

// PR룸 설정을 site_settings(section="pr_room")에서 읽는다.
// 공개 페이지(/pr)에서 쓰이므로 unstable_cache로 감싸 정적 렌더링을 유지하고,
// 관리자 저장 시 site-settings PUT 의 revalidateTag("pr_room")로 즉시 갱신한다.
const getPrRoomCached = unstable_cache(
  async (): Promise<PrRoomConfig> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "pr_room")
      .maybeSingle();
    return normalizePrRoom(data?.config);
  },
  ["pr-room-config"],
  { tags: ["pr_room"], revalidate: 300 }
);

export async function getPrRoom(): Promise<PrRoomConfig> {
  try {
    return await getPrRoomCached();
  } catch {
    return DEFAULT_PR_ROOM;
  }
}
