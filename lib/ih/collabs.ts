import { createAdminClient } from "@/lib/supabase-server";

// Influencer Hub Phase 4.3 — 협업(제품 협찬 메이트 / 방문 인플루언서 / 일반 지점 활동) 등록.
// 제품 협찬 메이트 → ih_sponsors. 방문 인플루언서·일반 지점 활동 → ih_branch_marketing(activity_type로 구분).

export type IHSponsorInput = {
  influencer_id: number;
  product: string;
  round?: number | null;
  support_type?: string;
  send_date?: string | null;
  upload_due_date?: string | null;
  upload_date?: string | null;
  content_url?: string;
  cost?: number | null;
  status?: string;
  memo?: string; // "지원 내용" 서술형 텍스트도 여기에 포함(전용 컬럼 없음 — Phase 4.3 결정사항)
};

export function validateSponsorInput(input: IHSponsorInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.influencer_id) errors.influencer_id = "인플루언서가 지정되지 않았습니다.";
  if (!input.product || !input.product.trim()) errors.product = "제품명을 입력해주세요.";
  if (input.cost != null && (!Number.isFinite(input.cost) || input.cost < 0)) errors.cost = "비용은 0 이상의 숫자여야 합니다.";
  return errors;
}

export async function createSponsor(input: IHSponsorInput) {
  const errors = validateSponsorInput(input);
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_sponsors")
    .insert({
      influencer_id: input.influencer_id,
      product: input.product.trim(),
      round: input.round ?? null,
      support_type: input.support_type?.trim() || null,
      send_date: input.send_date || null,
      upload_due_date: input.upload_due_date || null,
      upload_date: input.upload_date || null,
      content_url: input.content_url?.trim() || null,
      cost: input.cost ?? null,
      status: input.status ?? "PLANNED",
      memo: input.memo?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ok: true as const, sponsor: data };
}

export type IHBranchActivityInput = {
  influencer_id: number;
  branch_id: number;
  activity_type: "GENERAL" | "INFLUENCER_VISIT";
  operation_type?: string;
  marketing_date?: string | null; // 진행일/방문일
  round?: number | null;
  cost?: number | null; // 협업비용/단가
  tax_type?: string; // 세금 "유형"만(3.3%, 원천징수, 면세 등) — 세액 자동계산 없음
  support_content?: string; // 지원내용/콘텐츠 설명
  support_date?: string | null;
  region?: string;
  follower_display?: string;
  views?: number | null;
  reactions?: number | null;
  content_url?: string;
  status?: string;
  memo?: string;
};

export function validateBranchActivityInput(input: IHBranchActivityInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.influencer_id) errors.influencer_id = "인플루언서가 지정되지 않았습니다.";
  if (!input.branch_id) errors.branch_id = "지점을 선택해주세요.";
  if (input.cost != null && (!Number.isFinite(input.cost) || input.cost < 0)) errors.cost = "비용은 0 이상의 숫자여야 합니다.";
  if (input.views != null && (!Number.isInteger(input.views) || input.views < 0)) errors.views = "조회수는 0 이상의 정수여야 합니다.";
  if (input.reactions != null && (!Number.isInteger(input.reactions) || input.reactions < 0))
    errors.reactions = "반응수는 0 이상의 정수여야 합니다.";
  return errors;
}

/** tax_type/activity_type 컬럼은 migrate_ih_branch_marketing_visit_type.sql 실행 전에는 존재하지 않을 수 있다.
 *  마이그레이션 미실행 상태에서도 나머지 필드는 저장되도록, 컬럼 누락 오류면 그 두 필드를 빼고 한 번 더 시도한다. */
export async function createBranchActivity(input: IHBranchActivityInput) {
  const errors = validateBranchActivityInput(input);
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const sb = createAdminClient();
  const baseRow = {
    influencer_id: input.influencer_id,
    branch_id: input.branch_id,
    operation_type: input.operation_type?.trim() || null,
    marketing_date: input.marketing_date || null,
    round: input.round ?? null,
    cost: input.cost ?? null,
    support_content: input.support_content?.trim() || null,
    support_date: input.support_date || null,
    region: input.region?.trim() || null,
    follower_display: input.follower_display?.trim() || null,
    views: input.views ?? null,
    reactions: input.reactions ?? null,
    content_url: input.content_url?.trim() || null,
    status: input.status ?? "IN_PROGRESS",
    memo: input.memo?.trim() || null,
  };
  const withNewCols = { ...baseRow, tax_type: input.tax_type?.trim() || null, activity_type: input.activity_type };

  let { data, error } = await sb.from("ih_branch_marketing").insert(withNewCols).select().single();
  if (error && /column .* does not exist/i.test(error.message)) {
    // migration 미실행 — tax_type/activity_type 없이 저장(구분 정보는 유실되지만 등록 자체는 막지 않는다)
    ({ data, error } = await sb.from("ih_branch_marketing").insert(baseRow).select().single());
  }
  if (error) throw error;
  return { ok: true as const, activity: data };
}

export type IHBranchOption = { id: number; branch_name: string };

export async function listBranchOptions(): Promise<IHBranchOption[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_branches")
    .select("id, branch_name")
    .eq("status", "ACTIVE")
    .order("branch_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
