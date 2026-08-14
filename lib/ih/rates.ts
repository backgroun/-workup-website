import { createAdminClient } from "@/lib/supabase-server";

// Influencer Hub Phase 4.3 — 단가 등록. 절대 기존 행을 UPDATE하지 않는다(이력 보존, Phase 1 결정사항).

export type IHRateInput = {
  influencer_id: number;
  content_type?: string;
  price?: number | null;
  tax_type?: string;
  effective_date: string;
  memo?: string;
};

export function validateRateInput(input: IHRateInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.influencer_id) errors.influencer_id = "인플루언서가 지정되지 않았습니다.";
  if (!input.effective_date) errors.effective_date = "적용일을 입력해주세요.";
  if (input.price != null && (!Number.isFinite(input.price) || input.price < 0)) errors.price = "단가는 0 이상의 숫자여야 합니다.";
  return errors;
}

export async function createRate(input: IHRateInput) {
  const errors = validateRateInput(input);
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_influencer_rates")
    .insert({
      influencer_id: input.influencer_id,
      content_type: input.content_type?.trim() || null,
      price: input.price ?? null,
      tax_type: input.tax_type?.trim() || null,
      effective_date: input.effective_date,
      memo: input.memo?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ok: true as const, rate: data };
}
