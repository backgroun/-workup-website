import { createAdminClient } from "@/lib/supabase-server";
import { stripBranchPrefix } from "./influencer-shared";

// migration을 아직 안 돌려서 테이블 자체가 없을 때의 오류 방어용 — Postgres 원본 에러("relation ... does not exist")와
// PostgREST가 스키마 캐시에서 못 찾았을 때 내는 PGRST205("Could not find the table ... in the schema cache") 둘 다 잡는다.
function isMissingTableError(message: string): boolean {
  return /relation .* does not exist/i.test(message) || /could not find the table/i.test(message);
}

// Influencer Hub Phase 4.3 — 협업(제품 협찬 메이트 / 방문 인플루언서 / 일반 지점 활동) 등록.
// 제품 협찬 메이트 → ih_sponsors. 방문 인플루언서·일반 지점 활동 → ih_branch_marketing(activity_type로 구분).

export type IHSponsorInput = {
  influencer_id: number;
  product: string;
  round?: number | null;
  support_type?: string; // "제공 제품 / 사이즈" — Phase 5부터 이 의미로 사용(라벨만 변경, 컬럼은 그대로 재사용)
  content_format?: string; // "콘텐츠 형태"(릴스/피드/유튜브 영상 등) — Phase 5 신규 컬럼
  send_date?: string | null;
  upload_date?: string | null;
  content_url?: string;
  /** 원가 — 입력되면(shipping_cost와 함께) cost는 이 둘의 합으로 자동 계산된다. */
  product_cost?: number | null;
  /** 택배비 — product_cost와 함께 cost를 구성한다. */
  shipping_cost?: number | null;
  /** 총 비용. product_cost/shipping_cost 중 하나라도 입력되면 그 합으로 덮어써진다(직접 입력값은 무시).
   *  둘 다 비어 있으면(Excel 업로드 등 세부 항목 없이 총액만 넘어오는 경우) 그대로 사용한다. */
  cost?: number | null;
  /** 게시물 조회수 — 자동 추출 대신 수동 입력(Phase 5 보완). */
  views?: number | null;
  /** 좋아요/댓글 — Phase 8 성과 관리. migrate_add_ih_sponsors_engagement.sql 전이면 저장되지 않는다. */
  likes?: number | null;
  comments?: number | null;
  status?: string;
  memo?: string; // "지원 내용" 서술형 텍스트도 여기에 포함(전용 컬럼 없음 — Phase 4.3 결정사항)
};

export function validateSponsorInput(input: IHSponsorInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.influencer_id) errors.influencer_id = "인플루언서가 지정되지 않았습니다.";
  if (!input.product || !input.product.trim()) errors.product = "제품명을 입력해주세요.";
  if (input.cost != null && (!Number.isFinite(input.cost) || input.cost < 0)) errors.cost = "비용은 0 이상의 숫자여야 합니다.";
  if (input.product_cost != null && (!Number.isFinite(input.product_cost) || input.product_cost < 0)) errors.product_cost = "원가는 0 이상의 숫자여야 합니다.";
  if (input.shipping_cost != null && (!Number.isFinite(input.shipping_cost) || input.shipping_cost < 0)) errors.shipping_cost = "택배비는 0 이상의 숫자여야 합니다.";
  if (input.views != null && (!Number.isInteger(input.views) || input.views < 0)) errors.views = "조회수는 0 이상의 정수여야 합니다.";
  if (input.likes != null && (!Number.isInteger(input.likes) || input.likes < 0)) errors.likes = "좋아요는 0 이상의 정수여야 합니다.";
  if (input.comments != null && (!Number.isInteger(input.comments) || input.comments < 0)) errors.comments = "댓글은 0 이상의 정수여야 합니다.";
  return errors;
}

/** cost(총 비용) = product_cost(원가) + shipping_cost(택배비). 둘 중 하나라도 입력되면 합계로 계산하고,
 *  둘 다 없으면(Excel 업로드처럼 세부 항목 없이 총액만 오는 경우) 넘어온 cost를 그대로 쓴다. */
function resolveCost(input: Pick<IHSponsorInput, "cost" | "product_cost" | "shipping_cost">): number | null {
  if (input.product_cost != null || input.shipping_cost != null) {
    return (input.product_cost ?? 0) + (input.shipping_cost ?? 0);
  }
  return input.cost ?? null;
}

/** 같은 콘텐츠 URL이 같은 테이블에 이미 등록돼 있는지 확인한다(중복 등록 실수 방지). 빈 값은 검사하지 않는다. */
async function findDuplicateContentUrl(table: "ih_sponsors" | "ih_branch_marketing", contentUrl: string, excludeId?: number) {
  const sb = createAdminClient();
  let q = sb.from(table).select("id").eq("content_url", contentUrl);
  if (excludeId != null) q = q.neq("id", excludeId);
  const { data } = await q.maybeSingle();
  return data as { id: number } | null;
}

/** content_format/product_cost/shipping_cost 컬럼은 관련 migration 실행 전에는 존재하지 않을 수 있다.
 *  미실행 상태에서도 나머지 필드는 저장되도록, 컬럼 누락 오류면 그 필드들을 빼고 한 번 더 시도한다. */
export async function createSponsor(input: IHSponsorInput) {
  const errors = validateSponsorInput(input);
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const contentUrl = input.content_url?.trim();
  if (contentUrl && (await findDuplicateContentUrl("ih_sponsors", contentUrl))) {
    return { ok: false as const, errors: { content_url: "이미 등록된 콘텐츠 URL입니다." } };
  }

  const sb = createAdminClient();
  // 회차는 수동 입력을 받지 않고 항상 자동 카운팅한다(해당 인플루언서 기존 최댓값+1).
  const round = await getNextSponsorRound(input.influencer_id);
  const baseRow = {
    influencer_id: input.influencer_id,
    product: input.product.trim(),
    round,
    support_type: input.support_type?.trim() || null,
    send_date: input.send_date || null,
    upload_date: input.upload_date || null,
    content_url: input.content_url?.trim() || null,
    cost: resolveCost(input),
    status: input.status ?? "PLANNED",
    memo: input.memo?.trim() || null,
  };
  const withNewCols = {
    ...baseRow,
    content_format: input.content_format?.trim() || null,
    product_cost: input.product_cost ?? null,
    shipping_cost: input.shipping_cost ?? null,
    views: input.views ?? null,
    likes: input.likes ?? null,
    comments: input.comments ?? null,
  };

  let { data, error } = await sb.from("ih_sponsors").insert(withNewCols).select().single();
  if (error && /column .* does not exist/i.test(error.message)) {
    ({ data, error } = await sb.from("ih_sponsors").insert(baseRow).select().single());
  }
  if (error) throw error;
  return { ok: true as const, sponsor: data };
}

/** 상태 변경 등 부분 수정. updated_at은 DB에 트리거가 없으므로 여기서 명시적으로 갱신한다. */
export async function updateSponsor(id: number, input: Partial<IHSponsorInput>) {
  if (input.content_url !== undefined) {
    const contentUrl = input.content_url?.trim();
    if (contentUrl && (await findDuplicateContentUrl("ih_sponsors", contentUrl, id))) {
      return { ok: false as const, errors: { content_url: "이미 등록된 콘텐츠 URL입니다." } };
    }
  }

  const sb = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.product !== undefined) patch.product = input.product.trim();
  if (input.round !== undefined) patch.round = input.round;
  if (input.support_type !== undefined) patch.support_type = input.support_type?.trim() || null;
  if (input.content_format !== undefined) patch.content_format = input.content_format?.trim() || null;
  if (input.send_date !== undefined) patch.send_date = input.send_date || null;
  if (input.upload_date !== undefined) patch.upload_date = input.upload_date || null;
  if (input.content_url !== undefined) patch.content_url = input.content_url?.trim() || null;
  if (input.product_cost !== undefined) patch.product_cost = input.product_cost;
  if (input.shipping_cost !== undefined) patch.shipping_cost = input.shipping_cost;
  if (input.product_cost !== undefined || input.shipping_cost !== undefined || input.cost !== undefined) {
    patch.cost = resolveCost({ cost: input.cost, product_cost: input.product_cost, shipping_cost: input.shipping_cost });
  }
  if (input.views !== undefined) patch.views = input.views;
  if (input.likes !== undefined) patch.likes = input.likes;
  if (input.comments !== undefined) patch.comments = input.comments;
  if (input.status !== undefined) patch.status = input.status;
  if (input.memo !== undefined) patch.memo = input.memo?.trim() || null;

  let { data, error } = await sb.from("ih_sponsors").update(patch).eq("id", id).select().single();
  if (error && /column .* does not exist/i.test(error.message)) {
    delete patch.content_format;
    delete patch.product_cost;
    delete patch.shipping_cost;
    delete patch.views;
    delete patch.likes;
    delete patch.comments;
    ({ data, error } = await sb.from("ih_sponsors").update(patch).eq("id", id).select().single());
  }
  if (error) throw error;
  return data;
}

export type IHSponsorListRow = {
  id: number;
  influencerId: number;
  influencerNickname: string;
  influencerChannel: string;
  influencerFollowerDisplay: string | null;
  product: string;
  round: number | null;
  supportType: string | null;
  contentFormat: string | null;
  sendDate: string | null;
  uploadDate: string | null;
  cost: number | null;
  views: number | null;
  status: string;
  updatedAt: string;
};

export type IHSponsorSearchParams = {
  influencerQ?: string;
  productQ?: string;
  status?: string;
  contentFormat?: string;
  dateFrom?: string; // send_date 기준
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

type RawSponsorListRow = {
  id: number;
  influencer_id: number;
  product: string;
  round: number | null;
  support_type: string | null;
  content_format?: string | null;
  send_date: string | null;
  upload_date: string | null;
  cost: number | null;
  views?: number | null;
  status: string;
  updated_at: string;
  ih_influencers: { id: number; nickname: string; channel: string; follower_display: string | null } | { id: number; nickname: string; channel: string; follower_display: string | null }[] | null;
};

const SPONSOR_LIST_COLUMNS_BASE =
  "id, influencer_id, product, round, support_type, send_date, upload_date, cost, status, updated_at, ih_influencers!inner(id, nickname, channel, follower_display)";
const SPONSOR_LIST_COLUMNS_FULL = `id, influencer_id, product, round, support_type, content_format, send_date, upload_date, cost, views, status, updated_at, ih_influencers!inner(id, nickname, channel, follower_display)`;

function mapSponsorListRow(r: RawSponsorListRow): IHSponsorListRow {
  const inf = Array.isArray(r.ih_influencers) ? r.ih_influencers[0] : r.ih_influencers;
  return {
    id: r.id,
    influencerId: r.influencer_id,
    influencerNickname: inf?.nickname ?? "-",
    influencerChannel: inf?.channel ?? "-",
    influencerFollowerDisplay: inf?.follower_display ?? null,
    product: r.product,
    round: r.round,
    supportType: r.support_type,
    contentFormat: r.content_format ?? null,
    sendDate: r.send_date,
    uploadDate: r.upload_date,
    cost: r.cost,
    views: r.views ?? null,
    status: r.status,
    updatedAt: r.updated_at,
  };
}

/** 제품 협찬 전체 목록 — "제품 협찬" 메뉴의 협찬 현황 화면. content_format 컬럼 미적용 상태도 방어한다. */
export async function searchSponsors(params: IHSponsorSearchParams): Promise<{ items: IHSponsorListRow[]; total: number }> {
  const sb = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(5000, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const runQuery = async (columns: string) => {
    // 발송일 기준으로 묶어 보여줄 것이므로, 발송일 미정(NULL)을 맨 앞에 두고 최신 발송일부터 정렬한다.
    let q = sb
      .from("ih_sponsors")
      .select(columns, { count: "exact" })
      .order("send_date", { ascending: false, nullsFirst: true })
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (params.status) q = q.eq("status", params.status);
    if (params.contentFormat) q = q.eq("content_format", params.contentFormat);
    if (params.dateFrom) q = q.gte("send_date", params.dateFrom);
    if (params.dateTo) q = q.lte("send_date", params.dateTo);
    if (params.productQ) q = q.ilike("product", `%${params.productQ}%`);
    if (params.influencerQ) q = q.ilike("ih_influencers.nickname", `%${params.influencerQ}%`);
    return q;
  };

  let { data, error, count } = await runQuery(SPONSOR_LIST_COLUMNS_FULL);
  if (error && /column .* does not exist/i.test(error.message)) {
    ({ data, error, count } = await runQuery(SPONSOR_LIST_COLUMNS_BASE));
  }
  if (error) throw error;

  return {
    items: ((data ?? []) as unknown as RawSponsorListRow[]).map(mapSponsorListRow),
    total: count ?? 0,
  };
}

/** 협찬 목록 필터의 "콘텐츠 형태" Dropdown — 실제 등록된 값만 노출(하드코딩 금지). */
export async function getDistinctSponsorContentFormats(): Promise<string[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("ih_sponsors").select("content_format").not("content_format", "is", null);
  if (error) {
    if (/column .* does not exist/i.test(error.message)) return [];
    throw error;
  }
  const set = new Set<string>();
  for (const r of data ?? []) {
    const v = (r as { content_format: string | null }).content_format;
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}

export type IHSponsorDetail = {
  id: number;
  influencerId: number;
  influencer: { id: number; nickname: string; channel: string; followerDisplay: string | null; contentType: string[]; activityArea: string[] };
  product: string;
  round: number | null;
  supportType: string | null;
  contentFormat: string | null;
  sendDate: string | null;
  uploadDate: string | null;
  contentUrl: string | null;
  /** 원가 — migrate_add_ih_sponsors_cost_breakdown.sql 전이면 항상 null. */
  productCost: number | null;
  /** 택배비 — migrate_add_ih_sponsors_cost_breakdown.sql 전이면 항상 null. */
  shippingCost: number | null;
  cost: number | null;
  /** 게시물 조회수 — migrate_add_ih_sponsors_views.sql 전이면 항상 null. */
  views: number | null;
  /** 좋아요/댓글 — migrate_add_ih_sponsors_engagement.sql 전이면 항상 null(Phase 8). */
  likes: number | null;
  comments: number | null;
  status: string;
  memo: string | null;
  updatedAt: string;
};

/** 협찬 상세 — 목록 클릭 시 이동하는 화면과 Mobile Viewer 연동에 사용. */
export async function getSponsorDetail(id: number): Promise<IHSponsorDetail | null> {
  const sb = createAdminClient();
  const columns =
    "id, influencer_id, product, round, support_type, content_format, send_date, upload_date, content_url, cost, product_cost, shipping_cost, views, likes, comments, status, memo, updated_at, ih_influencers(id, nickname, channel, follower_display, content_type, activity_area)";
  let { data, error } = await sb.from("ih_sponsors").select(columns).eq("id", id).maybeSingle();
  if (error && /column .* does not exist/i.test(error.message)) {
    const fallbackColumns =
      "id, influencer_id, product, round, support_type, send_date, upload_date, content_url, cost, status, memo, updated_at, ih_influencers(id, nickname, channel, follower_display, content_type, activity_area)";
    ({ data, error } = await sb.from("ih_sponsors").select(fallbackColumns).eq("id", id).maybeSingle());
  }
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: number;
    influencer_id: number;
    product: string;
    round: number | null;
    support_type: string | null;
    content_format?: string | null;
    send_date: string | null;
    upload_date: string | null;
    content_url: string | null;
    cost: number | null;
    product_cost?: number | null;
    shipping_cost?: number | null;
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    status: string;
    memo: string | null;
    updated_at: string;
    ih_influencers:
      | { id: number; nickname: string; channel: string; follower_display: string | null; content_type: string[]; activity_area: string[] }
      | { id: number; nickname: string; channel: string; follower_display: string | null; content_type: string[]; activity_area: string[] }[]
      | null;
  };
  const inf = Array.isArray(row.ih_influencers) ? row.ih_influencers[0] : row.ih_influencers;

  return {
    id: row.id,
    influencerId: row.influencer_id,
    influencer: {
      id: inf?.id ?? row.influencer_id,
      nickname: inf?.nickname ?? "-",
      channel: inf?.channel ?? "-",
      followerDisplay: inf?.follower_display ?? null,
      contentType: inf?.content_type ?? [],
      activityArea: Array.isArray(inf?.activity_area) ? inf!.activity_area : [],
    },
    product: row.product,
    round: row.round,
    supportType: row.support_type,
    contentFormat: row.content_format ?? null,
    sendDate: row.send_date,
    uploadDate: row.upload_date,
    contentUrl: row.content_url,
    productCost: row.product_cost ?? null,
    shippingCost: row.shipping_cost ?? null,
    cost: row.cost,
    views: row.views ?? null,
    likes: row.likes ?? null,
    comments: row.comments ?? null,
    status: row.status,
    memo: row.memo,
    updatedAt: row.updated_at,
  };
}

/** 제품 협찬 목록에서 여러 건을 선택해 한 번에 바꾼다. ih_sponsors에는 반응수 컬럼이 없어 조회수/비용만 지원한다. */
export type IHSponsorBulkPatch = {
  status?: string;
  send_date?: string | null;
  views?: number | null;
  cost?: number | null;
};

/** 제품 협찬 목록에서 여러 건을 선택해 상태/발송일/조회수/비용을 한 번에 바꾼다. */
export async function bulkUpdateSponsors(ids: number[], patch: IHSponsorBulkPatch): Promise<number> {
  if (ids.length === 0) return 0;
  const sb = createAdminClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.send_date !== undefined) row.send_date = patch.send_date;
  if (patch.views !== undefined) row.views = patch.views;
  if (patch.cost !== undefined) row.cost = patch.cost;
  const { error, count } = await sb.from("ih_sponsors").update(row, { count: "exact" }).in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

export type IHSponsorInvoiceRow = {
  id: number;
  receiverName: string | null;
  address: string | null;
  phone: string | null;
  product: string;
};

/** 로젠택배 대량접수 양식(송장업로드용) 다운로드에 필요한 최소 정보만 모은다 — 받는분 실명/주소/연락처/품목. */
export async function getSponsorInvoiceRows(ids: number[]): Promise<IHSponsorInvoiceRow[]> {
  if (ids.length === 0) return [];
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_sponsors")
    .select("id, product, ih_influencers(name, nickname, phone, address)")
    .in("id", ids);
  if (error) throw error;
  type Row = {
    id: number;
    product: string;
    ih_influencers: { name: string | null; nickname: string; phone: string | null; address: string | null } | { name: string | null; nickname: string; phone: string | null; address: string | null }[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const inf = Array.isArray(r.ih_influencers) ? r.ih_influencers[0] : r.ih_influencers;
    return {
      id: r.id,
      receiverName: inf ? (inf.name ? `${inf.nickname}(${inf.name})` : inf.nickname) : null,
      address: inf?.address ?? null,
      phone: inf?.phone ?? null,
      product: r.product,
    };
  });
}

/** Excel 업로드 시 "닉네임" → influencer_id 매칭용 — 전체 인플루언서의 id/닉네임만 가볍게 조회한다. */
export async function listInfluencerNicknameIndex(): Promise<{ id: number; nickname: string }[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("ih_influencers").select("id, nickname").order("nickname", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type IHSponsorBulkRow = {
  id?: number;
  influencer_id: number;
  product: string;
  round: number | null;
  support_type: string | null;
  content_format: string | null;
  send_date: string | null;
  upload_date: string | null;
  content_url: string | null;
  cost: number | null;
  status: string;
  memo: string | null;
};

/** Excel 대량 업로드 — ID 있는 행은 수정(upsert), 없는 행은 신규(insert). 기존 매장 업로드와 동일한 패턴.
 *  content_format 컬럼 미적용 상태도 방어(컬럼 누락 오류면 그 필드를 빼고 재시도). */
export async function bulkUpsertSponsors(rows: IHSponsorBulkRow[]): Promise<{ inserted: number; updated: number }> {
  const sb = createAdminClient();
  const updates = rows.filter((r) => r.id != null);
  const inserts = rows.filter((r) => r.id == null);

  const runUpdates = async (withContentFormat: boolean) => {
    if (updates.length === 0) return { error: null };
    const payload = updates.map(({ id, ...rest }) => {
      const row: Record<string, unknown> = { id, ...rest };
      if (!withContentFormat) delete row.content_format;
      return row;
    });
    return sb.from("ih_sponsors").upsert(payload, { onConflict: "id" });
  };
  const runInserts = async (withContentFormat: boolean) => {
    if (inserts.length === 0) return { error: null };
    const payload = inserts.map(({ id: _id, ...rest }) => {
      const row: Record<string, unknown> = { ...rest };
      if (!withContentFormat) delete row.content_format;
      return row;
    });
    return sb.from("ih_sponsors").insert(payload);
  };

  let updateRes = await runUpdates(true);
  let insertRes = await runInserts(true);
  const missingColumn = /column .* does not exist/i.test(updateRes.error?.message ?? insertRes.error?.message ?? "");
  if (missingColumn) {
    updateRes = await runUpdates(false);
    insertRes = await runInserts(false);
  }
  if (updateRes.error) throw updateRes.error;
  if (insertRes.error) throw insertRes.error;

  return { inserted: inserts.length, updated: updates.length };
}

/** 다음 회차 자동 제안 — 해당 인플루언서의 기존 협찬 중 최댓값+1(없으면 1). */
export async function getNextSponsorRound(influencerId: number): Promise<number> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_sponsors")
    .select("round")
    .eq("influencer_id", influencerId)
    .not("round", "is", null)
    .order("round", { ascending: false })
    .limit(1);
  if (error) throw error;
  const maxRound = data?.[0]?.round as number | undefined;
  return (maxRound ?? 0) + 1;
}

export type IHBranchMarketingBulkRow = {
  id?: number;
  influencer_id: number;
  branch_id: number;
  activity_type: "INFLUENCER_VISIT";
  marketing_date: string | null;
  round: number | null;
  cost: number | null;
  content_format: string | null;
  views: number | null;
  reactions: number | null;
  content_url: string | null;
  status: string;
  memo: string | null;
};

/** Excel 대량 업로드 — ID 있는 행은 수정(upsert), 없는 행은 신규(insert). 제품 협찬 대량 업로드와 동일한 패턴.
 *  content_format/activity_type 컬럼 미적용 상태도 방어(컬럼 누락 오류면 그 필드들을 빼고 재시도). */
export async function bulkUpsertBranchMarketing(rows: IHBranchMarketingBulkRow[]): Promise<{ inserted: number; updated: number }> {
  const sb = createAdminClient();
  const updates = rows.filter((r) => r.id != null);
  const inserts = rows.filter((r) => r.id == null);

  const runUpdates = async (withNewCols: boolean) => {
    if (updates.length === 0) return { error: null };
    const payload = updates.map(({ id, ...rest }) => {
      const row: Record<string, unknown> = { id, ...rest };
      if (!withNewCols) {
        delete row.content_format;
        delete row.activity_type;
      }
      return row;
    });
    return sb.from("ih_branch_marketing").upsert(payload, { onConflict: "id" });
  };
  const runInserts = async (withNewCols: boolean) => {
    if (inserts.length === 0) return { error: null };
    const payload = inserts.map(({ id: _id, ...rest }) => {
      const row: Record<string, unknown> = { ...rest };
      if (!withNewCols) {
        delete row.content_format;
        delete row.activity_type;
      }
      return row;
    });
    return sb.from("ih_branch_marketing").insert(payload);
  };

  let updateRes = await runUpdates(true);
  let insertRes = await runInserts(true);
  const missingColumn = /column .* does not exist/i.test(updateRes.error?.message ?? insertRes.error?.message ?? "");
  if (missingColumn) {
    updateRes = await runUpdates(false);
    insertRes = await runInserts(false);
  }
  if (updateRes.error) throw updateRes.error;
  if (insertRes.error) throw insertRes.error;

  return { inserted: inserts.length, updated: updates.length };
}

/** 다음 회차 자동 부여 — 해당 인플루언서의 기존 지점 마케팅 중 최댓값+1(없으면 1). 지점 마케팅은 무조건 방문이라 수동 입력을 받지 않는다. */
export async function getNextBranchMarketingRound(influencerId: number): Promise<number> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_branch_marketing")
    .select("round")
    .eq("influencer_id", influencerId)
    .not("round", "is", null)
    .order("round", { ascending: false })
    .limit(1);
  if (error) throw error;
  const maxRound = data?.[0]?.round as number | undefined;
  return (maxRound ?? 0) + 1;
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
  follower_display?: string; // 마케팅 당시 팔로워 수 스냅샷(원본 표기 그대로) — 과거 성과 분석용, 현재 값으로 덮어쓰지 않는다.
  content_format?: string; // "콘텐츠 형태"(릴스/피드/유튜브 영상 등) — Phase 6 신규 컬럼
  views?: number | null;
  /** 반응수 — 이 프로젝트에서는 좋아요와 같은 의미로 다룬다(Phase 8 성과 관리). */
  reactions?: number | null;
  /** 댓글 — Phase 8 성과 관리. migrate_add_ih_branch_marketing_comments.sql 전이면 저장되지 않는다. */
  comments?: number | null;
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
  if (input.comments != null && (!Number.isInteger(input.comments) || input.comments < 0))
    errors.comments = "댓글은 0 이상의 정수여야 합니다.";
  return errors;
}

/** tax_type/activity_type 컬럼은 migrate_ih_branch_marketing_visit_type.sql 실행 전에는 존재하지 않을 수 있다.
 *  마이그레이션 미실행 상태에서도 나머지 필드는 저장되도록, 컬럼 누락 오류면 그 두 필드를 빼고 한 번 더 시도한다. */
export async function createBranchActivity(input: IHBranchActivityInput) {
  const errors = validateBranchActivityInput(input);
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const contentUrl = input.content_url?.trim();
  if (contentUrl && (await findDuplicateContentUrl("ih_branch_marketing", contentUrl))) {
    return { ok: false as const, errors: { content_url: "이미 등록된 콘텐츠 URL입니다." } };
  }

  const sb = createAdminClient();
  // 회차는 수동 입력을 받지 않고 항상 자동 카운팅한다(해당 인플루언서 기존 최댓값+1).
  const round = await getNextBranchMarketingRound(input.influencer_id);
  const baseRow = {
    influencer_id: input.influencer_id,
    branch_id: input.branch_id,
    operation_type: input.operation_type?.trim() || null,
    marketing_date: input.marketing_date || null,
    round,
    cost: input.cost ?? null,
    support_content: input.support_content?.trim() || null,
    support_date: input.support_date || null,
    region: input.region?.trim() || null,
    follower_display: input.follower_display?.trim() || null,
    views: input.views ?? null,
    reactions: input.reactions ?? null,
    content_url: input.content_url?.trim() || null,
    status: input.status ?? "VISIT_SCHEDULED",
    memo: input.memo?.trim() || null,
  };
  const withNewCols = {
    ...baseRow,
    tax_type: input.tax_type?.trim() || null,
    activity_type: input.activity_type,
    content_format: input.content_format?.trim() || null,
  };
  const withComments = { ...withNewCols, comments: input.comments ?? null };

  // comments(Phase 8)와 tax_type/activity_type/content_format(Phase 4.3/6)은 서로 다른 migration이라
  // 어느 한쪽만 미실행일 수도 있다 — comments만 뺀 단계를 먼저 시도해 이미 실행된 migration은 살린다.
  let { data, error } = await sb.from("ih_branch_marketing").insert(withComments).select().single();
  if (error && /column .* does not exist/i.test(error.message)) {
    ({ data, error } = await sb.from("ih_branch_marketing").insert(withNewCols).select().single());
  }
  if (error && /column .* does not exist/i.test(error.message)) {
    // 둘 다 미실행 — 신규 컬럼 없이 저장(구분 정보는 유실되지만 등록 자체는 막지 않는다)
    ({ data, error } = await sb.from("ih_branch_marketing").insert(baseRow).select().single());
  }
  if (error) throw error;
  return { ok: true as const, activity: data };
}

/** 상태 변경 등 부분 수정. updated_at은 DB에 트리거가 없으므로 여기서 명시적으로 갱신한다. */
export async function updateBranchActivity(id: number, input: Partial<IHBranchActivityInput>) {
  const errors = validateBranchActivityInput({ influencer_id: input.influencer_id ?? 1, branch_id: input.branch_id ?? 1, activity_type: "GENERAL", ...input });
  // influencer_id/branch_id/activity_type은 수정 시 보통 안 바뀌므로 위 검증은 cost/views/reactions 형식만 실질적으로 확인한다.
  if (input.cost != null && errors.cost) return { ok: false as const, errors: { cost: errors.cost } };
  if (input.views != null && errors.views) return { ok: false as const, errors: { views: errors.views } };
  if (input.reactions != null && errors.reactions) return { ok: false as const, errors: { reactions: errors.reactions } };

  if (input.content_url !== undefined) {
    const contentUrl = input.content_url?.trim();
    if (contentUrl && (await findDuplicateContentUrl("ih_branch_marketing", contentUrl, id))) {
      return { ok: false as const, errors: { content_url: "이미 등록된 콘텐츠 URL입니다." } };
    }
  }

  const sb = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.branch_id !== undefined) patch.branch_id = input.branch_id;
  if (input.operation_type !== undefined) patch.operation_type = input.operation_type?.trim() || null;
  if (input.marketing_date !== undefined) patch.marketing_date = input.marketing_date || null;
  if (input.round !== undefined) patch.round = input.round;
  if (input.cost !== undefined) patch.cost = input.cost;
  if (input.tax_type !== undefined) patch.tax_type = input.tax_type?.trim() || null;
  if (input.support_content !== undefined) patch.support_content = input.support_content?.trim() || null;
  if (input.support_date !== undefined) patch.support_date = input.support_date || null;
  if (input.region !== undefined) patch.region = input.region?.trim() || null;
  if (input.follower_display !== undefined) patch.follower_display = input.follower_display?.trim() || null;
  if (input.content_format !== undefined) patch.content_format = input.content_format?.trim() || null;
  if (input.views !== undefined) patch.views = input.views;
  if (input.reactions !== undefined) patch.reactions = input.reactions;
  if (input.comments !== undefined) patch.comments = input.comments;
  if (input.content_url !== undefined) patch.content_url = input.content_url?.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.memo !== undefined) patch.memo = input.memo?.trim() || null;

  let { data, error } = await sb.from("ih_branch_marketing").update(patch).eq("id", id).select().single();
  if (error && /column .* does not exist/i.test(error.message)) {
    delete patch.comments;
    ({ data, error } = await sb.from("ih_branch_marketing").update(patch).eq("id", id).select().single());
  }
  if (error && /column .* does not exist/i.test(error.message)) {
    delete patch.tax_type;
    delete patch.content_format;
    ({ data, error } = await sb.from("ih_branch_marketing").update(patch).eq("id", id).select().single());
  }
  if (error) throw error;
  return { ok: true as const, activity: data };
}

export type IHBranchOption = { id: number; branch_name: string };

/** 지점 마케팅의 "지점" 목록 — 별도 지점 테이블을 두지 않고 고객용 매장 정보(stores)를 그대로 재사용한다
 *  (관리자는 이미 /admin/stores에서 매장을 등록/관리하고 있으므로 중복 관리 화면을 만들지 않는다). */
export async function listBranchOptions(): Promise<IHBranchOption[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("stores")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, branch_name: r.name }));
}

// ── Phase 6: 지점 마케팅 목록/상세(전체 지점을 가로지르는 화면) ──────────────

export type IHBranchMarketingListRow = {
  id: number;
  branchId: number;
  branchName: string;
  influencerId: number | null;
  influencerNickname: string | null;
  influencerChannel: string | null;
  operationType: string | null;
  activityType: "GENERAL" | "INFLUENCER_VISIT";
  marketingDate: string | null;
  statusDate: string | null;
  round: number | null;
  cost: number | null;
  views: number | null;
  reactions: number | null;
  contentFormat: string | null;
  status: string;
  memo: string | null;
  updatedAt: string;
};

export type IHBranchMarketingSearchParams = {
  branchId?: number;
  influencerQ?: string;
  operationType?: string;
  status?: string;
  contentFormat?: string;
  dateFrom?: string; // marketing_date 기준
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

type RawBranchMarketingListRow = {
  id: number;
  branch_id: number;
  influencer_id: number | null;
  operation_type: string | null;
  activity_type?: "GENERAL" | "INFLUENCER_VISIT";
  marketing_date: string | null;
  support_date: string | null;
  round: number | null;
  cost: number | null;
  views: number | null;
  reactions: number | null;
  content_format?: string | null;
  status: string;
  memo: string | null;
  updated_at: string;
  stores: { id: number; name: string } | { id: number; name: string }[] | null;
  ih_influencers: { id: number; nickname: string; channel: string } | { id: number; nickname: string; channel: string }[] | null;
};

const BRANCH_MKT_LIST_COLUMNS_BASE =
  "id, branch_id, influencer_id, operation_type, marketing_date, support_date, round, cost, views, reactions, status, memo, updated_at, stores!inner(id, name), ih_influencers(id, nickname, channel)";
const BRANCH_MKT_LIST_COLUMNS_FULL = `id, branch_id, influencer_id, operation_type, activity_type, marketing_date, support_date, round, cost, views, reactions, content_format, status, memo, updated_at, stores!inner(id, name), ih_influencers(id, nickname, channel)`;

function mapBranchMarketingListRow(r: RawBranchMarketingListRow): IHBranchMarketingListRow {
  const branch = Array.isArray(r.stores) ? r.stores[0] : r.stores;
  const inf = Array.isArray(r.ih_influencers) ? r.ih_influencers[0] : r.ih_influencers;
  return {
    id: r.id,
    branchId: r.branch_id,
    branchName: branch?.name ? stripBranchPrefix(branch.name) : "-",
    influencerId: r.influencer_id,
    influencerNickname: inf?.nickname ?? null,
    influencerChannel: inf?.channel ?? null,
    operationType: r.operation_type,
    activityType: r.activity_type ?? "GENERAL",
    marketingDate: r.marketing_date,
    statusDate: r.support_date,
    round: r.round,
    cost: r.cost,
    views: r.views,
    reactions: r.reactions,
    contentFormat: r.content_format ?? null,
    status: r.status,
    memo: r.memo,
    updatedAt: r.updated_at,
  };
}

/** 지점 마케팅 전체 목록 — "지점 마케팅" 메뉴. activity_type/content_format 컬럼 미적용 상태도 방어한다. */
export async function searchBranchMarketing(
  params: IHBranchMarketingSearchParams
): Promise<{ items: IHBranchMarketingListRow[]; total: number }> {
  const sb = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(5000, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const runQuery = async (columns: string) => {
    let q = sb.from("ih_branch_marketing").select(columns, { count: "exact" }).order("marketing_date", { ascending: false, nullsFirst: true }).range(from, to);
    if (params.branchId) q = q.eq("branch_id", params.branchId);
    if (params.status) q = q.eq("status", params.status);
    if (params.operationType) q = q.ilike("operation_type", `%${params.operationType}%`);
    if (params.contentFormat) q = q.eq("content_format", params.contentFormat);
    if (params.dateFrom) q = q.gte("marketing_date", params.dateFrom);
    if (params.dateTo) q = q.lte("marketing_date", params.dateTo);
    if (params.influencerQ) q = q.ilike("ih_influencers.nickname", `%${params.influencerQ}%`);
    return q;
  };

  let { data, error, count } = await runQuery(BRANCH_MKT_LIST_COLUMNS_FULL);
  if (error && /column .* does not exist/i.test(error.message)) {
    ({ data, error, count } = await runQuery(BRANCH_MKT_LIST_COLUMNS_BASE));
  }
  if (error) throw error;

  return {
    items: ((data ?? []) as unknown as RawBranchMarketingListRow[]).map(mapBranchMarketingListRow),
    total: count ?? 0,
  };
}

/** 지점 마케팅 목록 필터의 "콘텐츠 형태" Dropdown — 실제 등록된 값만 노출. */
export async function getDistinctBranchMarketingContentFormats(): Promise<string[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("ih_branch_marketing").select("content_format").not("content_format", "is", null);
  if (error) {
    if (/column .* does not exist/i.test(error.message)) return [];
    throw error;
  }
  const set = new Set<string>();
  for (const r of data ?? []) {
    const v = (r as { content_format: string | null }).content_format;
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}

/** 지점 마케팅 목록에서 여러 건을 선택해 한 번에 바꾼다(제품 협찬 목록의 일괄 변경과 동일 패턴). */
export type IHBranchMarketingBulkPatch = {
  status?: string;
  support_date?: string | null;
  views?: number | null;
  reactions?: number | null;
  cost?: number | null;
};

export async function bulkUpdateBranchMarketing(ids: number[], patch: IHBranchMarketingBulkPatch): Promise<number> {
  if (ids.length === 0) return 0;
  const sb = createAdminClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.support_date !== undefined) row.support_date = patch.support_date;
  if (patch.views !== undefined) row.views = patch.views;
  if (patch.reactions !== undefined) row.reactions = patch.reactions;
  if (patch.cost !== undefined) row.cost = patch.cost;
  const { error, count } = await sb.from("ih_branch_marketing").update(row, { count: "exact" }).in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

/** 제품 협찬 요약 집계 — 현재 필터 결과 기준. ih_sponsors에는 반응수 컬럼이 없어 CPE는 계산하지 않는다. */
export function summarizeSponsorPerformance(items: IHSponsorListRow[]) {
  const totalCount = items.length;
  const totalCost = items.reduce((s, r) => s + (r.cost ?? 0), 0);
  const viewsRows = items.filter((r) => r.views != null);
  const totalViews = viewsRows.reduce((s, r) => s + (r.views ?? 0), 0);
  return {
    totalCount,
    totalCost,
    totalViews,
    avgViews: viewsRows.length > 0 ? Math.round(totalViews / viewsRows.length) : null,
    cpv: totalViews > 0 ? Math.round(totalCost / totalViews) : null,
  };
}

/** 지점별 성과 집계 — 현재 필터 결과 기준(전체 지점 또는 특정 지점으로 좁혀서 볼 수 있다). */
export function summarizeBranchPerformance(items: IHBranchMarketingListRow[]) {
  const totalCount = items.length;
  const totalCost = items.reduce((s, r) => s + (r.cost ?? 0), 0);
  const viewsRows = items.filter((r) => r.views != null);
  const totalViews = viewsRows.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalReactions = items.reduce((s, r) => s + (r.reactions ?? 0), 0);
  return {
    totalCount,
    totalCost,
    totalViews,
    avgViews: viewsRows.length > 0 ? Math.round(totalViews / viewsRows.length) : null,
    cpv: totalViews > 0 ? Math.round(totalCost / totalViews) : null,
    cpe: totalReactions > 0 ? Math.round(totalCost / totalReactions) : null,
  };
}

export type IHBranchMarketingDetail = {
  id: number;
  branchId: number;
  branchName: string;
  influencerId: number | null;
  influencer: { id: number; nickname: string; channel: string; followerDisplay: string | null } | null;
  operationType: string | null;
  activityType: "GENERAL" | "INFLUENCER_VISIT";
  marketingDate: string | null;
  round: number | null;
  cost: number | null;
  taxType: string | null;
  supportContent: string | null;
  supportDate: string | null;
  region: string | null;
  followerDisplay: string | null;
  contentFormat: string | null;
  views: number | null;
  reactions: number | null;
  /** 댓글 — migrate_add_ih_branch_marketing_comments.sql 전이면 항상 null(Phase 8). */
  comments: number | null;
  contentUrl: string | null;
  status: string;
  memo: string | null;
  updatedAt: string;
};

/** 지점 마케팅 상세 — 목록 클릭 시 이동하는 화면과 Mobile Viewer 연동에 사용. */
export async function getBranchMarketingDetail(id: number): Promise<IHBranchMarketingDetail | null> {
  const sb = createAdminClient();
  const columnsWithComments =
    "id, branch_id, influencer_id, operation_type, activity_type, marketing_date, round, cost, tax_type, support_content, support_date, region, follower_display, content_format, views, reactions, comments, content_url, status, memo, updated_at, stores(id, name), ih_influencers(id, nickname, channel, follower_display)";
  const columns =
    "id, branch_id, influencer_id, operation_type, activity_type, marketing_date, round, cost, tax_type, support_content, support_date, region, follower_display, content_format, views, reactions, content_url, status, memo, updated_at, stores(id, name), ih_influencers(id, nickname, channel, follower_display)";
  const fallbackColumns =
    "id, branch_id, influencer_id, operation_type, marketing_date, round, cost, support_content, support_date, region, follower_display, views, reactions, content_url, status, memo, updated_at, stores(id, name), ih_influencers(id, nickname, channel, follower_display)";
  let { data, error } = await sb.from("ih_branch_marketing").select(columnsWithComments).eq("id", id).maybeSingle();
  if (error && /column .* does not exist/i.test(error.message)) {
    ({ data, error } = await sb.from("ih_branch_marketing").select(columns).eq("id", id).maybeSingle());
  }
  if (error && /column .* does not exist/i.test(error.message)) {
    ({ data, error } = await sb.from("ih_branch_marketing").select(fallbackColumns).eq("id", id).maybeSingle());
  }
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: number;
    branch_id: number;
    influencer_id: number | null;
    operation_type: string | null;
    activity_type?: "GENERAL" | "INFLUENCER_VISIT";
    marketing_date: string | null;
    round: number | null;
    cost: number | null;
    tax_type?: string | null;
    support_content: string | null;
    support_date: string | null;
    region: string | null;
    follower_display: string | null;
    content_format?: string | null;
    views: number | null;
    reactions: number | null;
    comments?: number | null;
    content_url: string | null;
    status: string;
    memo: string | null;
    updated_at: string;
    stores: { id: number; name: string } | { id: number; name: string }[] | null;
    ih_influencers:
      | { id: number; nickname: string; channel: string; follower_display: string | null }
      | { id: number; nickname: string; channel: string; follower_display: string | null }[]
      | null;
  };
  const branch = Array.isArray(row.stores) ? row.stores[0] : row.stores;
  const inf = Array.isArray(row.ih_influencers) ? row.ih_influencers[0] : row.ih_influencers;

  return {
    id: row.id,
    branchId: row.branch_id,
    branchName: branch?.name ? stripBranchPrefix(branch.name) : "-",
    influencerId: row.influencer_id,
    influencer: inf ? { id: inf.id, nickname: inf.nickname, channel: inf.channel, followerDisplay: inf.follower_display } : null,
    operationType: row.operation_type,
    activityType: row.activity_type ?? "GENERAL",
    marketingDate: row.marketing_date,
    round: row.round,
    cost: row.cost,
    taxType: row.tax_type ?? null,
    supportContent: row.support_content,
    supportDate: row.support_date,
    region: row.region,
    followerDisplay: row.follower_display,
    contentFormat: row.content_format ?? null,
    views: row.views,
    reactions: row.reactions,
    comments: row.comments ?? null,
    contentUrl: row.content_url,
    status: row.status,
    memo: row.memo,
    updatedAt: row.updated_at,
  };
}

// ── Phase 7: 브랜디드 PPL(ih_branded_ppl) — 연예인/PPL(유튜브)/인플루언서 모델 단가(게런티) 예상 리스트.
// 실제 인플루언서 등록/집행 이력이 아니라 "이런 조건에 이 정도 단가"를 정리해두는 견적 리스트라
// ih_influencers와 연결하지 않는다(실제 진행 확정 시 사용자가 인플루언서 탭에 수동 등록). 구분별로
// 필요한 필드가 서로 달라(연예인=키/의견, PPL·인플루언서=구독자/콘텐츠형태) 전용 컬럼을 두고
// 구분에 맞지 않는 칸은 비워둔다. 팔로워(인플루언서)와 구독자(PPL)는 사실상 같은 의미라 구독자
// 하나의 속성(subscriber_count, 숫자)으로 통합해서 관리하고 화면에는 formatFollowerDisplay로
// "1.3만" 형태로 표시한다.

export type IHBrandedPplInput = {
  category: string; // CELEBRITY | PPL | INFLUENCER
  name: string; // 모델명/채널명/인플루언서명
  height?: string | null; // 키 — 연예인
  opinion?: string | null; // 의견(포지셔닝) — 연예인
  contractPeriod?: string | null; // 기준(예: 6개월) — 연예인
  subscriberCount?: number | null; // 구독자/팔로워 수 — PPL, 인플루언서
  mainCast?: string | null; // 메인패널 — PPL
  adProduct?: string | null; // 광고상품/콘텐츠 형태 — PPL, 인플루언서
  channelLink?: string | null; // 채널 링크 — PPL, 인플루언서
  cost?: number | null;
  status?: string;
  memo?: string;
  /** 단가 변경 사유 — 단가(cost)가 실제로 바뀔 때만 이력에 남긴다. 저장되는 컬럼은 아니고 이력 기록용. */
  costChangeReason?: string;
};

export function validateBrandedPplInput(input: IHBrandedPplInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.category) errors.category = "구분을 선택해주세요.";
  if (!input.name || !input.name.trim()) errors.name = "모델명/채널명/인플루언서명을 입력해주세요.";
  if (input.cost != null && (!Number.isFinite(input.cost) || input.cost < 0)) errors.cost = "비용은 0 이상의 숫자여야 합니다.";
  return errors;
}

export async function createBrandedPpl(input: IHBrandedPplInput) {
  const errors = validateBrandedPplInput(input);
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const sb = createAdminClient();
  const row = {
    category: input.category,
    name: input.name.trim(),
    height: input.height?.trim() || null,
    opinion: input.opinion?.trim() || null,
    contract_period: input.contractPeriod?.trim() || null,
    subscriber_count: input.subscriberCount ?? null,
    main_cast: input.mainCast?.trim() || null,
    ad_product: input.adProduct?.trim() || null,
    channel_link: input.channelLink?.trim() || null,
    cost: input.cost ?? null,
    status: input.status ?? "NEGOTIATING",
    memo: input.memo?.trim() || null,
  };
  const { data, error } = await sb.from("ih_branded_ppl").insert(row).select().single();
  if (error) throw error;
  return { ok: true as const, brandedPpl: data };
}

/** 상태 변경 등 부분 수정. updated_at은 DB에 트리거가 없으므로 여기서 명시적으로 갱신한다.
 *  단가(cost)가 실제로 바뀌면 ih_branded_ppl_price_history에 이전값/새값/사유를 함께 남긴다. */
export async function updateBrandedPpl(id: number, input: Partial<IHBrandedPplInput>) {
  const sb = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.category !== undefined) patch.category = input.category;
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.height !== undefined) patch.height = input.height?.trim() || null;
  if (input.opinion !== undefined) patch.opinion = input.opinion?.trim() || null;
  if (input.contractPeriod !== undefined) patch.contract_period = input.contractPeriod?.trim() || null;
  if (input.subscriberCount !== undefined) patch.subscriber_count = input.subscriberCount ?? null;
  if (input.mainCast !== undefined) patch.main_cast = input.mainCast?.trim() || null;
  if (input.adProduct !== undefined) patch.ad_product = input.adProduct?.trim() || null;
  if (input.channelLink !== undefined) patch.channel_link = input.channelLink?.trim() || null;
  if (input.cost !== undefined) patch.cost = input.cost;
  if (input.status !== undefined) patch.status = input.status;
  if (input.memo !== undefined) patch.memo = input.memo?.trim() || null;

  // 단가 변경 이력을 남기려면 수정 전 값이 필요하다 — cost 필드가 이번 수정에 포함된 경우에만 조회한다.
  let previousCost: number | null | undefined;
  if (input.cost !== undefined) {
    const { data: prevRow } = await sb.from("ih_branded_ppl").select("cost").eq("id", id).maybeSingle();
    previousCost = prevRow?.cost ?? null;
  }

  const { data, error } = await sb.from("ih_branded_ppl").update(patch).eq("id", id).select().single();
  if (error) throw error;

  if (input.cost !== undefined && (previousCost ?? null) !== (input.cost ?? null)) {
    const { error: histError } = await sb.from("ih_branded_ppl_price_history").insert({
      branded_ppl_id: id,
      old_cost: previousCost ?? null,
      new_cost: input.cost ?? null,
      reason: input.costChangeReason?.trim() || null,
    });
    // 이력 테이블 migration을 아직 안 돌렸어도 단가 수정 자체는 막지 않는다.
    // — 테이블이 아예 없으면 Postgres는 "relation ... does not exist"를, PostgREST는 스키마 캐시에서
    //   못 찾았다는 PGRST205("Could not find the table ...")를 낼 수 있어 둘 다 방어한다.
    if (histError && !isMissingTableError(histError.message)) throw histError;
  }

  return data;
}

export type IHBrandedPplPriceHistoryEntry = {
  id: number;
  oldCost: number | null;
  newCost: number | null;
  reason: string | null;
  changedAt: string;
};

/** 단가 변경 이력 — 최신순. migration 미실행이면 빈 배열(오류 아님)로 방어한다. */
export async function getBrandedPplPriceHistory(id: number): Promise<IHBrandedPplPriceHistoryEntry[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_branded_ppl_price_history")
    .select("id, old_cost, new_cost, reason, changed_at")
    .eq("branded_ppl_id", id)
    .order("changed_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw error;
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    oldCost: r.old_cost,
    newCost: r.new_cost,
    reason: r.reason,
    changedAt: r.changed_at,
  }));
}

export type IHBrandedPplListRow = {
  id: number;
  category: string;
  name: string;
  height: string | null;
  opinion: string | null;
  contractPeriod: string | null;
  subscriberCount: number | null;
  mainCast: string | null;
  adProduct: string | null;
  channelLink: string | null;
  cost: number | null;
  status: string;
  memo: string | null;
  updatedAt: string;
};

export type IHBrandedPplSearchParams = {
  nameQ?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

type RawBrandedPplListRow = {
  id: number;
  category: string;
  name: string;
  height: string | null;
  opinion: string | null;
  contract_period: string | null;
  subscriber_count: number | null;
  main_cast: string | null;
  ad_product: string | null;
  channel_link: string | null;
  cost: number | null;
  status: string;
  memo: string | null;
  updated_at: string;
};

const BRANDED_PPL_LIST_COLUMNS =
  "id, category, name, height, opinion, contract_period, subscriber_count, main_cast, ad_product, channel_link, cost, status, memo, updated_at";

function mapBrandedPplListRow(r: RawBrandedPplListRow): IHBrandedPplListRow {
  return {
    id: r.id,
    category: r.category,
    name: r.name,
    height: r.height,
    opinion: r.opinion,
    contractPeriod: r.contract_period,
    subscriberCount: r.subscriber_count,
    mainCast: r.main_cast,
    adProduct: r.ad_product,
    channelLink: r.channel_link,
    cost: r.cost,
    status: r.status,
    memo: r.memo,
    updatedAt: r.updated_at,
  };
}

/** 브랜디드 PPL 전체 목록 — "브랜디드/PPL" 메뉴. */
export async function searchBrandedPpl(params: IHBrandedPplSearchParams): Promise<{ items: IHBrandedPplListRow[]; total: number }> {
  const sb = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(5000, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = sb
    .from("ih_branded_ppl")
    .select(BRANDED_PPL_LIST_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);
  if (params.status) q = q.eq("status", params.status);
  if (params.category) q = q.eq("category", params.category);
  if (params.nameQ) q = q.ilike("name", `%${params.nameQ}%`);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    items: ((data ?? []) as unknown as RawBrandedPplListRow[]).map(mapBrandedPplListRow),
    total: count ?? 0,
  };
}

export type IHBrandedPplBulkPatch = {
  status?: string;
  category?: string;
  cost?: number | null;
};

/** 브랜디드 PPL 목록에서 여러 건을 선택해 상태/구분/단가를 한 번에 바꾼다. */
export async function bulkUpdateBrandedPpl(ids: number[], patch: IHBrandedPplBulkPatch): Promise<number> {
  if (ids.length === 0) return 0;
  const sb = createAdminClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.cost !== undefined) row.cost = patch.cost;
  const { error, count } = await sb.from("ih_branded_ppl").update(row, { count: "exact" }).in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

export type IHBrandedPplDetail = IHBrandedPplListRow;

/** 브랜디드 PPL 상세 — 목록 클릭 시 이동하는 화면과 Mobile Viewer 연동에 사용. */
export async function getBrandedPplDetail(id: number): Promise<IHBrandedPplDetail | null> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("ih_branded_ppl").select(BRANDED_PPL_LIST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return mapBrandedPplListRow(data as unknown as RawBrandedPplListRow);
}

/** Excel 대량 업로드 행 — ih_branded_ppl은 인플루언서 FK가 없는 자유 텍스트 구조라 협찬/지점마케팅
 *  업로드보다 단순하다(닉네임 매칭 불필요). id 있으면 수정, 없으면 신규. */
export type IHBrandedPplBulkRow = {
  id?: number;
  category: string;
  name: string;
  height: string | null;
  opinion: string | null;
  contract_period: string | null;
  subscriber_count: number | null;
  main_cast: string | null;
  ad_product: string | null;
  channel_link: string | null;
  cost: number | null;
  status: string;
  memo: string | null;
};

export async function bulkUpsertBrandedPpl(rows: IHBrandedPplBulkRow[]): Promise<{ inserted: number; updated: number }> {
  const sb = createAdminClient();
  const updates = rows.filter((r) => r.id != null);
  const inserts = rows.filter((r) => r.id == null);

  if (updates.length > 0) {
    const { error } = await sb.from("ih_branded_ppl").upsert(updates, { onConflict: "id" });
    if (error) throw error;
  }
  if (inserts.length > 0) {
    const { error } = await sb.from("ih_branded_ppl").insert(inserts.map(({ id: _id, ...rest }) => rest));
    if (error) throw error;
  }

  return { inserted: inserts.length, updated: updates.length };
}
