import { createAdminClient } from "@/lib/supabase-server";
import { getAdminMember } from "@/lib/admin-auth";

// Influencer Hub Phase 4.3 — 인플루언서 메모 "이력"(ih_influencer_memos, migrate_add_ih_influencer_memos.sql).
// 기존 ih_influencers.memo(단일 필드)와는 별개이며, 그 값을 변경하지 않는다.
// 테이블이 아직 생성되지 않았을 수 있어(마이그레이션 미실행) 모든 함수는 관련 오류를 조용히 빈 값으로 처리한다.

export type IHInfluencerMemoRow = {
  id: number;
  influencer_id: number;
  author_name: string | null;
  content: string;
  created_at: string;
};

export async function listInfluencerMemos(influencerId: number): Promise<IHInfluencerMemoRow[]> {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("ih_influencer_memos")
      .select("id, influencer_id, author_name, content, created_at")
      .eq("influencer_id", influencerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    // 테이블이 아직 없으면(마이그레이션 미실행) 이력 없음으로 처리 — 페이지 자체는 계속 렌더링되어야 한다.
    return [];
  }
}

export async function createInfluencerMemo(influencerId: number, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false as const, errors: { content: "메모 내용을 입력해주세요." } };

  const sb = createAdminClient();
  const admin = await getAdminMember();
  const { data, error } = await sb
    .from("ih_influencer_memos")
    .insert({
      influencer_id: influencerId,
      author_member_id: admin?.id ?? null,
      author_name: admin?.name ?? "알 수 없음",
      content: trimmed,
    })
    .select()
    .single();
  if (error) throw error;
  return { ok: true as const, memo: data as IHInfluencerMemoRow };
}
