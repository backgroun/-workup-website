import { createAdminClient } from "@/lib/supabase-server";
import { STATUS_LABEL, ACTIVITY_TYPE_LABEL, type IHInfluencerStatus, type IHBranchActivityType } from "./influencer-shared";
import { SUB_REGIONS } from "./regions";

// Influencer Hub — 인플루언서 데이터 접근/검증 헬퍼(서버 전용).
// 검색 로직은 searchInfluencers()로 분리해 Phase 10(복합 검색/태그/성과 추천)에서 그대로 확장한다.
// 값 상수(STATUS_LABEL 등)는 client 컴포넌트에서도 안전하게 쓸 수 있도록 influencer-shared.ts에 두고 여기서는 재수출만 한다.
export { STATUS_LABEL, ACTIVITY_TYPE_LABEL };
export type { IHInfluencerStatus, IHBranchActivityType };

export type IHInfluencerRow = {
  id: number;
  nickname: string;
  handle: string | null;
  channel: string;
  channel_id: string | null;
  channel_url: string | null;
  follower_display: string | null;
  follower_count: number | null;
  content_type: string[];
  /** Phase 4.1부터 TEXT[] — 인플루언서 1명이 여러 지역에서 활동할 수 있다(migrate_ih_activity_area_array.sql). */
  activity_area: string[];
  status: IHInfluencerStatus;
  match_status: "CONFIRMED" | "NEEDS_REVIEW";
  name: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  height: number | null;
  top_size: string | null;
  bottom_size: string | null;
  outer_size: string | null;
  upload_cycle: string | null;
  tags: string[];
  memo: string | null;
  source_sheet: string | null;
  source_row_ref: string | null;
  created_at: string;
  updated_at: string;
};

// ── 검색/목록 ──────────────────────────────────────────────────────────────

export type IHInfluencerSearchParams = {
  q?: string;
  channel?: string;
  contentType?: string;
  region?: string;
  followerMin?: number;
  followerMax?: number;
  status?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};

// 목록 화면에는 표시하지 않는 개인정보(name/phone/address 등)는 애초에 API 응답에 담지 않는다.
export type IHInfluencerListItem = Pick<
  IHInfluencerRow,
  | "id"
  | "nickname"
  | "handle"
  | "channel"
  | "channel_id"
  | "follower_display"
  | "follower_count"
  | "content_type"
  | "activity_area"
  | "status"
  | "match_status"
  | "tags"
  | "created_at"
> & {
  /** 최근 협업(제품협찬/지점마케팅 통틀어 가장 최근 1건) 라벨 — WORKUP 마케팅 DB이므로 목록에서 바로 확인 가능해야 한다. */
  recentCollabLabel: string | null;
  recentCollabDate: string | null;
};

const LIST_COLUMNS =
  "id, nickname, handle, channel, channel_id, follower_display, follower_count, content_type, activity_area, status, match_status, tags, created_at";

export type IHInfluencerSearchResult = {
  items: IHInfluencerListItem[];
  total: number;
  page: number;
  pageSize: number;
};

/** 인플루언서 검색/필터 — 목록 화면과 향후 Phase 10 복합검색이 공유하는 단일 서버 헬퍼. */
export async function searchInfluencers(params: IHInfluencerSearchParams): Promise<IHInfluencerSearchResult> {
  const sb = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb.from("ih_influencers").select(LIST_COLUMNS, { count: "exact" });

  const q = params.q?.trim();
  if (q) {
    // PostgREST or-filter 구분자(,())가 검색어에 섞이면 깨지므로 제거
    const safe = q.replace(/[,()]/g, " ").trim();
    if (safe) {
      query = query.or(
        `nickname.ilike.%${safe}%,handle.ilike.%${safe}%,channel.ilike.%${safe}%,channel_id.ilike.%${safe}%`
      );
    }
  }
  if (params.channel) query = query.eq("channel", params.channel);
  if (params.status) query = query.eq("status", params.status);
  // activity_area는 TEXT[] — 선택한 지역이 배열 안에 포함되는지로 검사(인플루언서가 복수 지역이어도 매칭됨).
  if (params.region) {
    // 시/도만 선택된 경우(공백 없음) 그 시/도의 모든 하위 지역("서울 강남구" 등)까지 함께 매칭한다.
    const subOptions = SUB_REGIONS[params.region];
    const candidates = subOptions ? [params.region, ...subOptions.map((s) => `${params.region} ${s}`)] : [params.region];
    query = query.overlaps("activity_area", candidates);
  }
  if (params.contentType) query = query.contains("content_type", [params.contentType]);
  if (params.tag) query = query.contains("tags", [params.tag]);
  // follower_count(정규화된 숫자) 기준으로만 범위 필터 — follower_display(원본 표시 문자열)는 사용하지 않는다.
  if (params.followerMin != null) query = query.gte("follower_count", params.followerMin);
  if (params.followerMax != null) query = query.lte("follower_count", params.followerMax);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  const items = await attachRecentCollab((data ?? []) as unknown as Omit<IHInfluencerListItem, "recentCollabLabel" | "recentCollabDate">[]);
  return { items, total: count ?? 0, page, pageSize };
}

/** 현재 페이지에 보이는 인플루언서들의 "최근 협업"(협찬/지점마케팅 통틀어 가장 최근 1건)을 한 번에 붙인다. */
async function attachRecentCollab<T extends { id: number }>(
  rows: T[]
): Promise<(T & { recentCollabLabel: string | null; recentCollabDate: string | null })[]> {
  if (rows.length === 0) return [];
  const sb = createAdminClient();
  const ids = rows.map((r) => r.id);

  const [sponsorsRes, branchRes] = await Promise.all([
    sb.from("ih_sponsors").select("influencer_id, product, upload_date, send_date, created_at").in("influencer_id", ids),
    sb
      .from("ih_branch_marketing")
      .select("influencer_id, marketing_date, created_at, ih_branches(branch_name)")
      .in("influencer_id", ids),
  ]);

  type Candidate = { date: string; label: string };
  const latest = new Map<number, Candidate>();
  const consider = (influencerId: number | null, date: string | null, label: string) => {
    if (influencerId == null || !date) return;
    const cur = latest.get(influencerId);
    if (!cur || date > cur.date) latest.set(influencerId, { date, label });
  };

  for (const s of sponsorsRes.data ?? []) {
    consider(s.influencer_id, s.upload_date ?? s.send_date ?? s.created_at, s.product);
  }
  type RawBranch = {
    influencer_id: number | null;
    marketing_date: string | null;
    created_at: string;
    ih_branches: { branch_name: string } | { branch_name: string }[] | null;
  };
  for (const b of (branchRes.data ?? []) as unknown as RawBranch[]) {
    const branchName = Array.isArray(b.ih_branches) ? b.ih_branches[0]?.branch_name : b.ih_branches?.branch_name;
    consider(b.influencer_id, b.marketing_date ?? b.created_at, branchName ?? "지점 마케팅");
  }

  return rows.map((r) => {
    const hit = latest.get(r.id);
    return { ...r, recentCollabLabel: hit?.label ?? null, recentCollabDate: hit?.date ?? null };
  });
}

/** 콘텐츠 필터 Dropdown용 — 현재 DB에 실제 등록된 content_type 값만 중복 제거해서 반환한다(임의 목록 아님). */
export async function getDistinctContentTypes(): Promise<string[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("ih_influencers").select("content_type");
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const c of row.content_type ?? []) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

export async function getInfluencerById(id: number): Promise<IHInfluencerRow | null> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("ih_influencers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as IHInfluencerRow | null) ?? null;
}

// ── 입력 검증 ──────────────────────────────────────────────────────────────

export type IHInfluencerInput = {
  nickname: string;
  channel?: string;
  handle?: string;
  channel_id?: string;
  channel_url?: string;
  follower_count?: number | null;
  follower_display?: string;
  content_type?: string[];
  activity_area?: string[];
  status?: IHInfluencerStatus;
  tags?: string[];
  name?: string;
  gender?: string;
  phone?: string;
  address?: string;
  height?: number | null;
  top_size?: string;
  bottom_size?: string;
  outer_size?: string;
  upload_cycle?: string;
  memo?: string;
};

const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

export function validateInfluencerInput(input: IHInfluencerInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.nickname || !input.nickname.trim()) errors.nickname = "닉네임을 입력해주세요.";

  if (input.height != null && (!Number.isFinite(input.height) || input.height <= 0)) {
    errors.height = "키는 숫자로 입력해주세요.";
  }
  if (input.follower_count != null && (!Number.isInteger(input.follower_count) || input.follower_count < 0)) {
    errors.follower_count = "팔로워 수는 0 이상의 정수여야 합니다.";
  }
  if (input.channel_url) {
    try {
      const u = new URL(input.channel_url);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error("invalid protocol");
    } catch {
      errors.channel_url = "올바른 URL 형식이 아닙니다. (예: https://instagram.com/...)";
    }
  }
  if (input.phone && !PHONE_RE.test(input.phone.trim())) {
    errors.phone = "연락처 형식을 확인해주세요.";
  }

  return errors;
}

function normalizeInfluencerInput(input: IHInfluencerInput) {
  return {
    nickname: input.nickname.trim(),
    channel: input.channel?.trim() || "Instagram",
    handle: input.handle?.trim() || null,
    channel_id: input.channel_id?.trim() || null,
    channel_url: input.channel_url?.trim() || null,
    follower_count: input.follower_count ?? null,
    follower_display: input.follower_display?.trim() || null,
    content_type: input.content_type ?? [],
    activity_area: input.activity_area ?? [],
    status: input.status ?? "ACTIVE",
    tags: input.tags ?? [],
    name: input.name?.trim() || null,
    gender: input.gender?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    height: input.height ?? null,
    top_size: input.top_size?.trim() || null,
    bottom_size: input.bottom_size?.trim() || null,
    outer_size: input.outer_size?.trim() || null,
    upload_cycle: input.upload_cycle?.trim() || null,
    memo: input.memo?.trim() || null,
  };
}

// ── 중복 판별(Phase 1 결정사항: channel_url → channel_id → channel+handle 순) ──

export async function findExactDuplicate(
  input: IHInfluencerInput,
  excludeId?: number
): Promise<IHInfluencerRow | null> {
  const sb = createAdminClient();
  const norm = normalizeInfluencerInput(input);

  if (norm.channel_url) {
    let q = sb.from("ih_influencers").select("*").eq("channel_url", norm.channel_url);
    if (excludeId != null) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (data) return data as IHInfluencerRow;
  }
  if (norm.channel_id) {
    let q = sb.from("ih_influencers").select("*").eq("channel_id", norm.channel_id);
    if (excludeId != null) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (data) return data as IHInfluencerRow;
  }
  if (norm.handle) {
    let q = sb.from("ih_influencers").select("*").eq("channel", norm.channel).eq("handle", norm.handle);
    if (excludeId != null) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (data) return data as IHInfluencerRow;
  }
  return null;
}

/** 닉네임만 같은 애매한 후보를 중복검수 큐에 등록한다(자동 병합 없음). */
async function flagNicknameCandidates(newRow: IHInfluencerRow) {
  const sb = createAdminClient();
  const { data: sameName } = await sb
    .from("ih_influencers")
    .select("id")
    .ilike("nickname", newRow.nickname)
    .neq("id", newRow.id);

  if (!sameName || sameName.length === 0) return;

  for (const other of sameName) {
    const a = Math.min(newRow.id, other.id);
    const b = Math.max(newRow.id, other.id);
    await sb
      .from("ih_influencer_duplicate_candidates")
      .upsert(
        { influencer_id_a: a, influencer_id_b: b, matched_on: "nickname", confidence: "LOW", status: "PENDING" },
        { onConflict: "influencer_id_a,influencer_id_b", ignoreDuplicates: true }
      );
  }
  const ids = [newRow.id, ...sameName.map((r) => r.id)];
  await sb.from("ih_influencers").update({ match_status: "NEEDS_REVIEW" }).in("id", ids);
}

export type CreateInfluencerResult =
  | { ok: true; influencer: IHInfluencerRow }
  | { ok: false; reason: "duplicate"; existing: IHInfluencerRow }
  | { ok: false; reason: "validation"; errors: Record<string, string> };

export async function createInfluencer(input: IHInfluencerInput): Promise<CreateInfluencerResult> {
  const errors = validateInfluencerInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, reason: "validation", errors };

  const existing = await findExactDuplicate(input);
  if (existing) return { ok: false, reason: "duplicate", existing };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_influencers")
    .insert({ ...normalizeInfluencerInput(input), source_sheet: "manual" })
    .select()
    .single();
  if (error) throw error;

  const row = data as IHInfluencerRow;
  await flagNicknameCandidates(row);
  return { ok: true, influencer: row };
}

export type UpdateInfluencerResult =
  | { ok: true; influencer: IHInfluencerRow }
  | { ok: false; reason: "duplicate"; existing: IHInfluencerRow }
  | { ok: false; reason: "validation"; errors: Record<string, string> }
  | { ok: false; reason: "not_found" };

export async function updateInfluencer(id: number, input: IHInfluencerInput): Promise<UpdateInfluencerResult> {
  const errors = validateInfluencerInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, reason: "validation", errors };

  const existing = await findExactDuplicate(input, id);
  if (existing) return { ok: false, reason: "duplicate", existing };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_influencers")
    .update(normalizeInfluencerInput(input))
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, reason: "not_found" };
  return { ok: true, influencer: data as IHInfluencerRow };
}

export async function updateInfluencerStatus(id: number, status: IHInfluencerStatus) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_influencers")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return (data as IHInfluencerRow | null) ?? null;
}

// ── 중복 후보 큐 ───────────────────────────────────────────────────────────

export type IHDuplicateCandidate = {
  id: number;
  influencerA: { id: number; nickname: string; channel: string } | null;
  influencerB: { id: number; nickname: string; channel: string } | null;
  matchedOn: string;
  confidence: string;
  status: string;
  createdAt: string;
};

export async function listPendingDuplicateCandidates(): Promise<IHDuplicateCandidate[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("ih_influencer_duplicate_candidates")
    .select(
      "id, matched_on, confidence, status, created_at, a:ih_influencers!ih_influencer_duplicate_candidates_influencer_id_a_fkey(id, nickname, channel), b:ih_influencers!ih_influencer_duplicate_candidates_influencer_id_b_fkey(id, nickname, channel)"
    )
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });
  if (error) throw error;

  type Raw = {
    id: number;
    matched_on: string;
    confidence: string;
    status: string;
    created_at: string;
    a: { id: number; nickname: string; channel: string } | { id: number; nickname: string; channel: string }[] | null;
    b: { id: number; nickname: string; channel: string } | { id: number; nickname: string; channel: string }[] | null;
  };
  const rows = (data ?? []) as unknown as Raw[];
  return rows.map((r) => ({
    id: r.id,
    influencerA: Array.isArray(r.a) ? r.a[0] ?? null : r.a,
    influencerB: Array.isArray(r.b) ? r.b[0] ?? null : r.b,
    matchedOn: r.matched_on,
    confidence: r.confidence,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/**
 * 중복 후보를 검수한다. '동일 인물'을 선택해도 실제 데이터 병합(FK 재연결)은 하지 않는다 —
 * 데이터 손실 위험이 있는 작업이라 이번 Phase에서는 검수 상태 변경까지만 처리하고,
 * 실제 병합 로직은 별도 승인 후 구현한다.
 */
export async function resolveDuplicateCandidate(
  candidateId: number,
  decision: "same" | "different",
  resolvedByMemberId?: string | number
) {
  const sb = createAdminClient();
  const { data: candidate, error: findErr } = await sb
    .from("ih_influencer_duplicate_candidates")
    .select("id, influencer_id_a, influencer_id_b")
    .eq("id", candidateId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!candidate) return null;

  const newStatus = decision === "same" ? "MERGED" : "REJECTED";
  const { data, error } = await sb
    .from("ih_influencer_duplicate_candidates")
    .update({ status: newStatus, resolved_by: resolvedByMemberId ?? null, resolved_at: new Date().toISOString() })
    .eq("id", candidateId)
    .select()
    .maybeSingle();
  if (error) throw error;

  // 남은 PENDING 후보가 없는 인플루언서는 다시 CONFIRMED로 되돌린다.
  for (const infId of [candidate.influencer_id_a, candidate.influencer_id_b]) {
    const { count } = await sb
      .from("ih_influencer_duplicate_candidates")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING")
      .or(`influencer_id_a.eq.${infId},influencer_id_b.eq.${infId}`);
    if (!count) {
      await sb.from("ih_influencers").update({ match_status: "CONFIRMED" }).eq("id", infId);
    }
  }

  return data;
}

// ── 인플루언서 상세(협찬/지점활동/단가/성과) ──────────────────────────────────

export type IHInfluencerSponsorRow = {
  id: number;
  product: string;
  round: number | null;
  support_type: string | null;
  send_date: string | null;
  upload_due_date: string | null;
  upload_date: string | null;
  content_url: string | null;
  cost: number | null;
  status: string;
  memo: string | null;
};

export type IHInfluencerBranchActivityRow = {
  id: number;
  branchName: string | null;
  marketingDate: string | null;
  operationType: string | null;
  round: number | null;
  cost: number | null;
  taxType: string | null;
  views: number | null;
  reactions: number | null;
  contentUrl: string | null;
  status: string;
  memo: string | null;
  /** GENERAL(일반 지점 마케팅) / INFLUENCER_VISIT(방문 인플루언서) — Phase 4.3. migration 전이면 항상 GENERAL. */
  activityType: IHBranchActivityType;
};

export type IHInfluencerRateRow = {
  id: number;
  contentType: string | null;
  price: number | null;
  taxType: string | null;
  effectiveDate: string;
  memo: string | null;
};

export type IHInfluencerDetail = {
  influencer: IHInfluencerRow;
  sponsors: IHInfluencerSponsorRow[];
  branchActivities: IHInfluencerBranchActivityRow[];
  currentRates: IHInfluencerRateRow[];
  rateHistory: IHInfluencerRateRow[];
  performance: {
    totalCollabs: number;
    totalViews: number;
    totalReactions: number;
    avgViews: number | null;
    avgReactions: number | null;
    totalCost: number;
    cpv: number | null;
    cpe: number | null;
  };
  pendingDuplicates: IHDuplicateCandidate[];
  memos: import("./memos").IHInfluencerMemoRow[];
};

const BRANCH_ACTIVITY_COLUMNS_BASE =
  "id, marketing_date, operation_type, round, cost, views, reactions, content_url, status, memo, ih_branches(branch_name)";
const BRANCH_ACTIVITY_COLUMNS_FULL = `${BRANCH_ACTIVITY_COLUMNS_BASE}, tax_type, activity_type`;

type RawBranchRow = {
  id: number;
  marketing_date: string | null;
  operation_type: string | null;
  round: number | null;
  cost: number | null;
  tax_type?: string | null;
  views: number | null;
  reactions: number | null;
  content_url: string | null;
  status: string;
  memo: string | null;
  activity_type?: IHBranchActivityType;
  ih_branches: { branch_name: string } | { branch_name: string }[] | null;
};

/** tax_type/activity_type은 Phase 4.3 migration(미실행 가능) 전제 컬럼 — 없으면 기본 컬럼만으로 재시도한다. */
async function fetchBranchActivitiesForInfluencer(id: number): Promise<RawBranchRow[]> {
  const sb = createAdminClient();
  const full = await sb
    .from("ih_branch_marketing")
    .select(BRANCH_ACTIVITY_COLUMNS_FULL)
    .eq("influencer_id", id)
    .order("marketing_date", { ascending: false });
  if (!full.error) return (full.data ?? []) as unknown as RawBranchRow[];
  if (!/column .* does not exist/i.test(full.error.message)) throw full.error;

  const base = await sb
    .from("ih_branch_marketing")
    .select(BRANCH_ACTIVITY_COLUMNS_BASE)
    .eq("influencer_id", id)
    .order("marketing_date", { ascending: false });
  if (base.error) throw base.error;
  return (base.data ?? []) as unknown as RawBranchRow[];
}

export async function getInfluencerDetail(id: number): Promise<IHInfluencerDetail | null> {
  const influencer = await getInfluencerById(id);
  if (!influencer) return null;

  const { listInfluencerMemos } = await import("./memos");

  const sb = createAdminClient();
  const [sponsorsRes, branchRows, currentRatesRes, rateHistoryRes, allDuplicates, memos] = await Promise.all([
    sb
      .from("ih_sponsors")
      .select("id, product, round, support_type, send_date, upload_due_date, upload_date, content_url, cost, status, memo")
      .eq("influencer_id", id)
      .order("created_at", { ascending: false }),
    fetchBranchActivitiesForInfluencer(id),
    sb.from("ih_influencer_rates_current").select("*").eq("influencer_id", id),
    sb
      .from("ih_influencer_rates")
      .select("id, content_type, price, tax_type, effective_date, memo")
      .eq("influencer_id", id)
      .order("effective_date", { ascending: false }),
    listPendingDuplicateCandidates(),
    listInfluencerMemos(id),
  ]);

  const branchActivities: IHInfluencerBranchActivityRow[] = branchRows.map((r) => ({
    id: r.id,
    branchName: Array.isArray(r.ih_branches) ? r.ih_branches[0]?.branch_name ?? null : r.ih_branches?.branch_name ?? null,
    marketingDate: r.marketing_date,
    operationType: r.operation_type,
    round: r.round,
    cost: r.cost,
    taxType: r.tax_type ?? null,
    views: r.views,
    reactions: r.reactions,
    contentUrl: r.content_url,
    status: r.status,
    memo: r.memo,
    activityType: r.activity_type ?? "GENERAL",
  }));

  const totalViews = branchActivities.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalReactions = branchActivities.reduce((s, r) => s + (r.reactions ?? 0), 0);
  const viewsRows = branchActivities.filter((r) => r.views != null);
  const reactionsRows = branchActivities.filter((r) => r.reactions != null);
  const totalCost =
    branchActivities.reduce((s, r) => s + (r.cost ?? 0), 0) + (sponsorsRes.data ?? []).reduce((s, r) => s + (r.cost ?? 0), 0);
  const totalCollabs = (sponsorsRes.data?.length ?? 0) + branchActivities.length;

  const mapRate = (r: {
    id: number;
    content_type: string | null;
    price: number | null;
    tax_type: string | null;
    effective_date: string;
    memo: string | null;
  }): IHInfluencerRateRow => ({
    id: r.id,
    contentType: r.content_type,
    price: r.price,
    taxType: r.tax_type,
    effectiveDate: r.effective_date,
    memo: r.memo,
  });

  return {
    influencer,
    sponsors: (sponsorsRes.data ?? []) as IHInfluencerSponsorRow[],
    branchActivities,
    currentRates: (currentRatesRes.data ?? []).map(mapRate),
    rateHistory: (rateHistoryRes.data ?? []).map(mapRate),
    performance: {
      totalCollabs,
      totalViews,
      totalReactions,
      avgViews: viewsRows.length > 0 ? Math.round(totalViews / viewsRows.length) : null,
      avgReactions: reactionsRows.length > 0 ? Math.round(totalReactions / reactionsRows.length) : null,
      totalCost,
      cpv: totalViews > 0 ? Math.round(totalCost / totalViews) : null,
      cpe: totalReactions > 0 ? Math.round(totalCost / totalReactions) : null,
    },
    pendingDuplicates: allDuplicates.filter(
      (c) => c.influencerA?.id === id || c.influencerB?.id === id
    ),
    memos,
  };
}

// ── Mobile Viewer 연동용 경량 요약(개인정보 제외) ─────────────────────────────
// PC 상세(getInfluencerDetail)와 Mobile Viewer가 서로 다른 조회 결과를 쓰지 않도록,
// toMobileSummary()는 이미 조회된 IHInfluencerDetail을 그대로 가공만 한다(추가 DB 조회 없음).

export type IHInfluencerMobileSummary = {
  id: number;
  nickname: string;
  channel: string;
  followerDisplay: string | null;
  contentType: string[];
  activityArea: string[];
  channelUrl: string | null;
  status: IHInfluencerStatus;
  tags: string[];
  sponsors: { id: number; product: string; status: string; uploadDueDate: string | null }[];
  branchActivities: {
    id: number;
    branchName: string | null;
    activityType: IHBranchActivityType;
    marketingDate: string | null;
    cost: number | null;
    description: string | null;
  }[];
  performance: { totalViews: number; totalReactions: number; cpv: number | null; cpe: number | null };
  currentRates: { contentType: string | null; price: number | null }[];
  rateHistory: { contentType: string | null; price: number | null; effectiveDate: string }[];
  memos: { id: number; authorName: string | null; content: string; createdAt: string }[];
};

/**
 * 모바일 Viewer에는 연락처/주소/실명은 포함하지 않는다.
 * (단가·지점활동 비용은 사용자 승인으로 Phase 4 UI개선에서 노출하도록 정책 변경됨 — 이전 Phase 4.3의 비노출 결정을 대체.)
 * 순수 변환 함수(DB 조회 없음) — PC 상세와 완전히 같은 조회 결과만 가공한다.
 */
export function toMobileSummary(detail: IHInfluencerDetail): IHInfluencerMobileSummary {
  const { influencer, branchActivities, sponsors, performance, currentRates, rateHistory, memos } = detail;

  return {
    id: influencer.id,
    nickname: influencer.nickname,
    channel: influencer.channel,
    followerDisplay: influencer.follower_display,
    contentType: influencer.content_type,
    activityArea: influencer.activity_area,
    channelUrl: influencer.channel_url,
    status: influencer.status,
    tags: influencer.tags,
    sponsors: sponsors.map((s) => ({ id: s.id, product: s.product, status: s.status, uploadDueDate: s.upload_due_date })),
    branchActivities: branchActivities.map((b) => ({
      id: b.id,
      branchName: b.branchName,
      activityType: b.activityType,
      marketingDate: b.marketingDate,
      cost: b.cost,
      description: b.operationType,
    })),
    performance: {
      totalViews: performance.totalViews,
      totalReactions: performance.totalReactions,
      cpv: performance.cpv,
      cpe: performance.cpe,
    },
    currentRates: currentRates.map((r) => ({ contentType: r.contentType, price: r.price })),
    rateHistory: rateHistory.map((r) => ({ contentType: r.contentType, price: r.price, effectiveDate: r.effectiveDate })),
    memos: memos.map((m) => ({ id: m.id, authorName: m.author_name, content: m.content, createdAt: m.created_at })),
  };
}

export async function getInfluencerMobileSummary(id: number): Promise<IHInfluencerMobileSummary | null> {
  const detail = await getInfluencerDetail(id);
  if (!detail) return null;
  return toMobileSummary(detail);
}
