import { createAdminClient } from "@/lib/supabase-server";
import { stores as staticStores, type Store } from "@/data/stores";

// 공개(고객용) 매장 목록의 단일 소스 = DB.
// - DB의 활성 매장을 사용 (관리자 수정이 즉시 반영). 비어 있으면 고객 화면도 빈다.
// - 좌표가 비어 있으면 정적 데이터(data/stores.ts)에서 id로 매칭해 보정
//   (지도·거리·길찾기가 좌표 없이 깨지는 것을 방지)
// - DB 조회 자체가 실패(장애)할 때만 정적 데이터로 폴백
export async function getPublicStores(region?: string): Promise<Store[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (region) query = query.eq("region", region);
    const { data, error } = await query;
    if (error) return staticStores; // DB 장애 시에만 폴백
    if (!data) return [];

    const byId = new Map(staticStores.map((s) => [s.id, s]));
    return data.map((s): Store => {
      const fb = byId.get(s.id);
      return {
        id: s.id,
        name: s.name,
        address: s.address,
        lat: s.lat ?? fb?.lat ?? 0,
        lng: s.lng ?? fb?.lng ?? 0,
        hours: s.hours ?? "",
        phone: s.phone ?? "",
      };
    });
  } catch {
    return staticStores;
  }
}
