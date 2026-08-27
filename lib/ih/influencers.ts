import { createAdminClient } from "@/lib/supabase-server";
import { STATUS_LABEL, ACTIVITY_TYPE_LABEL, stripBranchPrefix, type IHInfluencerStatus, type IHBranchActivityType } from "./influencer-shared";
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
  /** 제품 협찬 메이트/방문 인플루언서 고정 구분값 — migrate_ih_influencers_add_collab_types.sql 전이면 항상 []. */
  collab_types: ("SPONSOR" | "VISIT")[];
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
  /** 단가(ih_influencer_rates_current.price) 기준 예산 필터 — 지점 인플루언서 Pool 기능을 인플루언서 탭에 통합. */
  costMin?: number;
  costMax?: number;
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
  | "channel_url"
  | "follower_display"
  | "follower_count"
  | "content_type"
  | "activity_area"
  | "collab_types"
  | "status"
  | "match_status"
  | "tags"
  | "created_at"
> & {
  /** 최근 협업(제품협찬/지점마케팅 통틀어 가장 최근 1건) 라벨 — WORKUP 마케팅 DB이므로 목록에서 바로 확인 가능해야 한다. */
  recentCollabLabel: string | null;
  recentCollabDate: string | null;
  /** 협찬(ih_sponsors) + 지점마케팅(ih_branch_marketing) 통틀어 이 인플루언서와의 총 협업 횟수. */
  collabCount: number;
  /** 현재 단가(ih_influencer_rates_current) 최소/최대 — 콘텐츠 유형별로 여러 단가가 있을 수 있어 범위로 표시. 등록된 단가가 없으면 둘 다 null. */
  currentRateMin: number | null;
  currentRateMax: number | null;
};

const LIST_COLUMNS_BASE =
  "id, nickname, handle, channel, channel_id, channel_url, follower_display, follower_count, content_type, activity_area, status, match_status, tags, created_at";
const LIST_COLUMNS_FULL = `${LIST_COLUMNS_BASE}, collab_types`;

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
  const pageSize = Math.min(5000, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 예산(단가) 필터가 있으면 먼저 ih_influencer_rates_current에서 해당 범위의 influencer_id만 추려서
  // 본 쿼리를 그 id 목록으로 제한한다(VIEW라 PostgREST embed 조인이 불가능해 2단계 조회).
  let costFilterIds: number[] | null = null;
  if (params.costMin != null || params.costMax != null) {
    let rateQuery = sb.from("ih_influencer_rates_current").select("influencer_id");
    if (params.costMin != null) rateQuery = rateQuery.gte("price", params.costMin);
    if (params.costMax != null) rateQuery = rateQuery.lte("price", params.costMax);
    const { data: rateRows, error: rateError } = await rateQuery;
    if (rateError) throw rateError;
    costFilterIds = Array.from(new Set((rateRows ?? []).map((r) => r.influencer_id)));
    if (costFilterIds.length === 0) return { items: [], total: 0, page, pageSize };
  }

  let query = sb.from("ih_influencers").select(LIST_COLUMNS_FULL, { count: "exact" });
  if (costFilterIds) query = query.in("id", costFilterIds);

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

  let { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error && /column .* does not exist/i.test(error.message)) {
    // collab_types 컬럼 미적용(migrate_ih_influencers_add_collab_types.sql 실행 전) — 기본 컬럼만으로 재조회.
    let fallbackQuery = sb.from("ih_influencers").select(LIST_COLUMNS_BASE, { count: "exact" });
    if (costFilterIds) fallbackQuery = fallbackQuery.in("id", costFilterIds);
    if (q) {
      const safe = q.replace(/[,()]/g, " ").trim();
      if (safe) fallbackQuery = fallbackQuery.or(`nickname.ilike.%${safe}%,handle.ilike.%${safe}%,channel.ilike.%${safe}%,channel_id.ilike.%${safe}%`);
    }
    if (params.channel) fallbackQuery = fallbackQuery.eq("channel", params.channel);
    if (params.status) fallbackQuery = fallbackQuery.eq("status", params.status);
    if (params.region) {
      const subOptions = SUB_REGIONS[params.region];
      const candidates = subOptions ? [params.region, ...subOptions.map((s) => `${params.region} ${s}`)] : [params.region];
      fallbackQuery = fallbackQuery.overlaps("activity_area", candidates);
    }
    if (params.contentType) fallbackQuery = fallbackQuery.contains("content_type", [params.contentType]);
    if (params.tag) fallbackQuery = fallbackQuery.contains("tags", [params.tag]);
    if (params.followerMin != null) fallbackQuery = fallbackQuery.gte("follower_count", params.followerMin);
    if (params.followerMax != null) fallbackQuery = fallbackQuery.lte("follower_count", params.followerMax);
    const fallbackResult = await fallbackQuery.order("created_at", { ascending: false }).range(from, to);
    error = fallbackResult.error;
    count = fallbackResult.count;
    data = (fallbackResult.data ?? []).map((r) => ({ ...r, collab_types: [] as ("SPONSOR" | "VISIT")[] }));
  }
  if (error) throw error;

  const withCollab = await attachRecentCollab(
    (data ?? []) as unknown as Omit<IHInfluencerListItem, "recentCollabLabel" | "recentCollabDate" | "collabCount" | "currentRateMin" | "currentRateMax">[]
  );
  const items = await attachCurrentRateRange(withCollab);
  return { items, total: count ?? 0, page, pageSize };
}

/** 현재 페이지에 보이는 인플루언서들의 현재 단가(ih_influencer_rates_current) 최소/최대를 붙인다. */
async function attachCurrentRateRange<T extends { id: number }>(
  rows: T[]
): Promise<(T & { currentRateMin: number | null; currentRateMax: number | null })[]> {
  if (rows.length === 0) return [];
  const sb = createAdminClient();
  const ids = rows.map((r) => r.id);
  const { data, error } = await sb.from("ih_influencer_rates_current").select("influencer_id, price").in("influencer_id", ids);
  if (error) throw error;

  const range = new Map<number, { min: number; max: number }>();
  for (const r of data ?? []) {
    if (r.price == null) continue;
    const cur = range.get(r.influencer_id);
    if (!cur) range.set(r.influencer_id, { min: r.price, max: r.price });
    else {
      cur.min = Math.min(cur.min, r.price);
      cur.max = Math.max(cur.max, r.price);
    }
  }

  return rows.map((r) => {
    const hit = range.get(r.id);
    return { ...r, currentRateMin: hit?.min ?? null, currentRateMax: hit?.max ?? null };
  });
}

/** 현재 페이지에 보이는 인플루언서들의 "최근 협업"과 총 협업 횟수를 한 번에 붙인다.
 *  "최근 협업" 라벨/날짜는 인플루언서의 활동 유형(collab_types)에 맞는 소스만 사용한다 —
 *  제품 협찬 메이트는 ih_sponsors, 방문 인플루언서는 ih_branch_marketing(INFLUENCER_VISIT)만 반영해
 *  Mobile Viewer의 "최근 협찬 vs 최근 방문 활동" 분리와 동일한 기준을 목록에도 적용한다.
 *  활동 유형이 아직 지정 안 된 기존 데이터는 두 소스 모두 허용(데이터 누락 방지).
 *  총 협업 횟수(collabCount)는 기존대로 협찬+지점마케팅을 합산한다. */
async function attachRecentCollab<T extends { id: number; collab_types?: ("SPONSOR" | "VISIT")[] }>(
  rows: T[]
): Promise<(T & { recentCollabLabel: string | null; recentCollabDate: string | null; collabCount: number })[]> {
  if (rows.length === 0) return [];
  const sb = createAdminClient();
  const ids = rows.map((r) => r.id);

  const branchColumnsFull = "influencer_id, marketing_date, created_at, activity_type, stores(name)";
  const branchColumnsBase = "influencer_id, marketing_date, created_at, stores(name)";
  const [sponsorsRes, branchResFull] = await Promise.all([
    sb.from("ih_sponsors").select("influencer_id, product, upload_date, send_date, created_at").in("influencer_id", ids),
    sb.from("ih_branch_marketing").select(branchColumnsFull).in("influencer_id", ids),
  ]);
  // activity_type은 migrate_ih_branch_marketing_visit_type.sql 실행 전에는 없을 수 있다 — 없으면 기본 컬럼만 재조회.
  const branchRes = /column .* does not exist/i.test(branchResFull.error?.message ?? "")
    ? await sb.from("ih_branch_marketing").select(branchColumnsBase).in("influencer_id", ids)
    : branchResFull;

  type Candidate = { date: string; label: string };
  const latestSponsor = new Map<number, Candidate>();
  const latestVisit = new Map<number, Candidate>();
  const counts = new Map<number, number>();
  const bumpCount = (influencerId: number | null) => {
    if (influencerId == null) return;
    counts.set(influencerId, (counts.get(influencerId) ?? 0) + 1);
  };
  const considerLatest = (map: Map<number, Candidate>, influencerId: number | null, date: string | null, label: string) => {
    if (influencerId == null || !date) return;
    const cur = map.get(influencerId);
    if (!cur || date > cur.date) map.set(influencerId, { date, label });
  };

  for (const s of sponsorsRes.data ?? []) {
    bumpCount(s.influencer_id);
    considerLatest(latestSponsor, s.influencer_id, s.upload_date ?? s.send_date ?? s.created_at, s.product);
  }
  type RawBranch = {
    influencer_id: number | null;
    marketing_date: string | null;
    created_at: string;
    activity_type?: "GENERAL" | "INFLUENCER_VISIT";
    stores: { name: string } | { name: string }[] | null;
  };
  for (const b of (branchRes.data ?? []) as unknown as RawBranch[]) {
    bumpCount(b.influencer_id);
    if (b.activity_type !== "INFLUENCER_VISIT") continue; // 일반 지점 마케팅은 "최근 협업"에 반영하지 않는다.
    const branchName = Array.isArray(b.stores) ? b.stores[0]?.name : b.stores?.name;
    considerLatest(latestVisit, b.influencer_id, b.marketing_date ?? b.created_at, branchName ? stripBranchPrefix(branchName) : "방문 인플루언서");
  }

  return rows.map((r) => {
    const types = r.collab_types && r.collab_types.length > 0 ? r.collab_types : ["SPONSOR", "VISIT"];
    const candidates: Candidate[] = [];
    if (types.includes("SPONSOR")) {
      const c = latestSponsor.get(r.id);
      if (c) candidates.push(c);
    }
    if (types.includes("VISIT")) {
      const c = latestVisit.get(r.id);
      if (c) candidates.push(c);
    }
    const best = candidates.sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return { ...r, recentCollabLabel: best?.label ?? null, recentCollabDate: best?.date ?? null, collabCount: counts.get(r.id) ?? 0 };
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
  collab_types?: ("SPONSOR" | "VISIT")[];
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
    collab_types: input.collab_types ?? [],
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
  const insertRow = { ...normalizeInfluencerInput(input), source_sheet: "manual" };
  let { data, error } = await sb.from("ih_influencers").insert(insertRow).select().single();
  if (error && /column .* does not exist/i.test(error.message)) {
    // collab_types 컬럼 미적용 — 그 필드만 빼고 재시도(등록 자체는 막지 않는다).
    const { collab_types: _omit, ...withoutCollabTypes } = insertRow;
    ({ data, error } = await sb.from("ih_influencers").insert(withoutCollabTypes).select().single());
  }
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
  const updateRow = normalizeInfluencerInput(input);
  let { data, error } = await sb.from("ih_influencers").update(updateRow).eq("id", id).select().maybeSingle();
  if (error && /column .* does not exist/i.test(error.message)) {
    const { collab_types: _omit, ...withoutCollabTypes } = updateRow;
    ({ data, error } = await sb.from("ih_influencers").update(withoutCollabTypes).eq("id", id).select().maybeSingle());
  }
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

export type IHInfluencerBulkRow = IHInfluencerInput & { id?: number };
export type IHInfluencerBulkResult = { row: number; ok: boolean; reason?: string };

/** Excel 대량 업로드 — ID 있는 행은 수정, 없는 행은 신규 등록. 인플루언서는 채널URL 기준 중복 판별이 있어
 *  (findExactDuplicate) 협찬/지점 마케팅처럼 단순 upsert로 처리하지 않고 한 행씩 create/updateInfluencer를 태운다. */
export async function bulkImportInfluencers(rows: { rowNum: number; input: IHInfluencerBulkRow }[]): Promise<{
  inserted: number;
  updated: number;
  failed: IHInfluencerBulkResult[];
}> {
  let inserted = 0;
  let updated = 0;
  const failed: IHInfluencerBulkResult[] = [];

  for (const { rowNum, input } of rows) {
    const { id, ...rest } = input;
    if (id != null) {
      const result = await updateInfluencer(id, rest);
      if (result.ok) updated += 1;
      else failed.push({ row: rowNum, ok: false, reason: result.reason === "duplicate" ? "이미 등록된 채널 URL" : result.reason === "not_found" ? "ID를 찾을 수 없음" : "입력값 오류" });
    } else {
      const result = await createInfluencer(rest);
      if (result.ok) inserted += 1;
      else failed.push({ row: rowNum, ok: false, reason: result.reason === "duplicate" ? "이미 등록된 채널 URL" : "입력값 오류" });
    }
  }
  return { inserted, updated, failed };
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
  /** Phase 5 migration(migrate_add_ih_sponsors_content_format.sql) 전이면 항상 null. */
  content_format: string | null;
  send_date: string | null;
  upload_date: string | null;
  content_url: string | null;
  cost: number | null;
  /** migrate_add_ih_sponsors_views.sql 전이면 항상 null. */
  views: number | null;
  /** 좋아요/댓글 — migrate_add_ih_sponsors_engagement.sql 전이면 항상 null(Phase 8). */
  likes: number | null;
  comments: number | null;
  status: string;
  memo: string | null;
};

const SPONSOR_COLUMNS_BASE = "id, influencer_id, product, round, support_type, send_date, upload_date, content_url, cost, status, memo, created_at, updated_at";
const SPONSOR_COLUMNS_MID = `${SPONSOR_COLUMNS_BASE}, content_format, views`;
const SPONSOR_COLUMNS_FULL = `${SPONSOR_COLUMNS_MID}, likes, comments`;

/** content_format/views(Phase 5)와 likes/comments(Phase 8)는 서로 다른(둘 중 하나만 미실행일 수 있는) migration
 *  전제 컬럼 — 좋아요/댓글만 뺀 단계를 먼저 시도해 이미 실행된 조회수 migration까지 실수로 잃지 않는다. */
async function fetchSponsorsForInfluencer(id: number) {
  const sb = createAdminClient();
  const full = await sb.from("ih_sponsors").select(SPONSOR_COLUMNS_FULL).eq("influencer_id", id).order("created_at", { ascending: false });
  if (!full.error) return full.data ?? [];
  if (!/column .* does not exist/i.test(full.error.message)) throw full.error;

  const mid = await sb.from("ih_sponsors").select(SPONSOR_COLUMNS_MID).eq("influencer_id", id).order("created_at", { ascending: false });
  if (!mid.error) return (mid.data ?? []).map((r) => ({ ...r, likes: null, comments: null }));
  if (!/column .* does not exist/i.test(mid.error.message)) throw mid.error;

  const base = await sb.from("ih_sponsors").select(SPONSOR_COLUMNS_BASE).eq("influencer_id", id).order("created_at", { ascending: false });
  if (base.error) throw base.error;
  return (base.data ?? []).map((r) => ({ ...r, content_format: null, views: null, likes: null, comments: null }));
}

export type IHInfluencerBranchActivityRow = {
  id: number;
  branchId: number | null;
  branchName: string | null;
  marketingDate: string | null;
  operationType: string | null;
  round: number | null;
  cost: number | null;
  taxType: string | null;
  /** Phase 6 migration(migrate_add_ih_branch_marketing_content_format.sql) 전이면 항상 null. */
  contentFormat: string | null;
  views: number | null;
  /** 반응수 — 좋아요와 같은 의미로 다룬다(Phase 8 성과 관리). */
  reactions: number | null;
  /** 댓글 — migrate_add_ih_branch_marketing_comments.sql 전이면 항상 null(Phase 8). */
  comments: number | null;
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

/** 협업별 성과(Phase 8) — 제품 협찬/지점 마케팅을 소스 구분 없이 하나의 목록으로 합친 것.
 *  브랜디드 PPL은 콘텐츠 성과 개념이 없는 단가 견적 리스트라 대상에서 제외한다. */
export type IHInfluencerPerformanceItem = {
  id: number;
  source: "SPONSOR" | "BRANCH_MARKETING";
  label: string; // 제품명(협찬) / 지점명(마케팅)
  date: string | null; // 업로드일(협찬) / 진행일(마케팅)
  views: number | null;
  likes: number | null;
  comments: number | null;
  contentUrl: string | null;
  memo: string | null;
  detailHref: string;
};

export type IHInfluencerDetail = {
  influencer: IHInfluencerRow;
  sponsors: IHInfluencerSponsorRow[];
  branchActivities: IHInfluencerBranchActivityRow[];
  currentRates: IHInfluencerRateRow[];
  rateHistory: IHInfluencerRateRow[];
  performanceItems: IHInfluencerPerformanceItem[];
  performance: {
    totalCollabs: number;
    totalViews: number;
    totalReactions: number;
    avgViews: number | null;
    avgReactions: number | null;
    totalCost: number;
    cpv: number | null;
    cpe: number | null;
    /** 좋아요/댓글 — Phase 8. */
    totalLikes: number;
    totalComments: number;
    avgLikes: number | null;
    avgComments: number | null;
  };
  pendingDuplicates: IHDuplicateCandidate[];
  memos: import("./memos").IHInfluencerMemoRow[];
};

const BRANCH_ACTIVITY_COLUMNS_BASE =
  "id, branch_id, marketing_date, operation_type, round, cost, views, reactions, content_url, status, memo, stores(name)";
const BRANCH_ACTIVITY_COLUMNS_MID = `${BRANCH_ACTIVITY_COLUMNS_BASE}, tax_type, activity_type, content_format`;
const BRANCH_ACTIVITY_COLUMNS_FULL = `${BRANCH_ACTIVITY_COLUMNS_MID}, comments`;

type RawBranchRow = {
  id: number;
  branch_id: number | null;
  marketing_date: string | null;
  operation_type: string | null;
  round: number | null;
  cost: number | null;
  tax_type?: string | null;
  content_format?: string | null;
  views: number | null;
  reactions: number | null;
  comments?: number | null;
  content_url: string | null;
  status: string;
  memo: string | null;
  activity_type?: IHBranchActivityType;
  stores: { name: string } | { name: string }[] | null;
};

/** tax_type/activity_type(Phase 4.3)과 comments(Phase 8)는 서로 다른(둘 중 하나만 미실행일 수 있는) migration
 *  전제 컬럼 — 댓글만 뺀 단계를 먼저 시도해 이미 실행된 구분값 migration까지 실수로 잃지 않는다. */
async function fetchBranchActivitiesForInfluencer(id: number): Promise<RawBranchRow[]> {
  const sb = createAdminClient();
  const full = await sb
    .from("ih_branch_marketing")
    .select(BRANCH_ACTIVITY_COLUMNS_FULL)
    .eq("influencer_id", id)
    .order("marketing_date", { ascending: false });
  if (!full.error) return (full.data ?? []) as unknown as RawBranchRow[];
  if (!/column .* does not exist/i.test(full.error.message)) throw full.error;

  const mid = await sb
    .from("ih_branch_marketing")
    .select(BRANCH_ACTIVITY_COLUMNS_MID)
    .eq("influencer_id", id)
    .order("marketing_date", { ascending: false });
  if (!mid.error) return ((mid.data ?? []) as unknown as RawBranchRow[]).map((r) => ({ ...r, comments: null }));
  if (!/column .* does not exist/i.test(mid.error.message)) throw mid.error;

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
  const [sponsorRows, branchRows, currentRatesRes, rateHistoryRes, allDuplicates, memos] = await Promise.all([
    fetchSponsorsForInfluencer(id),
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
    branchId: r.branch_id,
    branchName: (() => {
      const n = Array.isArray(r.stores) ? r.stores[0]?.name : r.stores?.name;
      return n ? stripBranchPrefix(n) : null;
    })(),
    marketingDate: r.marketing_date,
    operationType: r.operation_type,
    round: r.round,
    cost: r.cost,
    taxType: r.tax_type ?? null,
    contentFormat: r.content_format ?? null,
    views: r.views,
    reactions: r.reactions,
    comments: r.comments ?? null,
    contentUrl: r.content_url,
    status: r.status,
    memo: r.memo,
    activityType: r.activity_type ?? "GENERAL",
  }));

  // 총 조회수/평균 조회수는 원래 지점 마케팅만 집계했는데(제품 협찬의 views가 이 화면에서 누락돼 있었음),
  // Phase 8부터는 두 소스를 다 더한다 — CPV 계산도 이제 제품 협찬 조회수까지 반영한다.
  const totalViews =
    branchActivities.reduce((s, r) => s + (r.views ?? 0), 0) + sponsorRows.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalReactions = branchActivities.reduce((s, r) => s + (r.reactions ?? 0), 0);
  const viewsRows = [...branchActivities.filter((r) => r.views != null), ...sponsorRows.filter((r) => r.views != null)];
  const reactionsRows = branchActivities.filter((r) => r.reactions != null);
  const totalCost =
    branchActivities.reduce((s, r) => s + (r.cost ?? 0), 0) + sponsorRows.reduce((s, r) => s + (r.cost ?? 0), 0);
  const totalCollabs = sponsorRows.length + branchActivities.length;

  // 좋아요/댓글 — Phase 8. 반응수(지점 마케팅)는 좋아요와 같은 의미로 합산한다.
  const totalLikes =
    sponsorRows.reduce((s, r) => s + (r.likes ?? 0), 0) + branchActivities.reduce((s, r) => s + (r.reactions ?? 0), 0);
  const totalComments =
    sponsorRows.reduce((s, r) => s + (r.comments ?? 0), 0) + branchActivities.reduce((s, r) => s + (r.comments ?? 0), 0);
  const likesRows = [...sponsorRows.filter((r) => r.likes != null), ...branchActivities.filter((r) => r.reactions != null)];
  const commentsRows = [...sponsorRows.filter((r) => r.comments != null), ...branchActivities.filter((r) => r.comments != null)];

  // 협업별 성과 — 제품 협찬/지점 마케팅을 하나의 목록으로 합쳐 인플루언서 상세 "성과" 탭에서 보여준다(Phase 8).
  const performanceItems: IHInfluencerPerformanceItem[] = [
    ...sponsorRows.map((r): IHInfluencerPerformanceItem => ({
      id: r.id,
      source: "SPONSOR",
      label: r.product,
      date: r.upload_date ?? r.send_date,
      views: r.views ?? null,
      likes: r.likes ?? null,
      comments: r.comments ?? null,
      contentUrl: r.content_url,
      memo: r.memo,
      detailHref: `/admin/influencer-hub/sponsors/${r.id}`,
    })),
    ...branchActivities.map((r): IHInfluencerPerformanceItem => ({
      id: r.id,
      source: "BRANCH_MARKETING",
      label: r.branchName ?? "-",
      date: r.marketingDate,
      views: r.views,
      likes: r.reactions,
      comments: r.comments,
      contentUrl: r.contentUrl,
      memo: r.memo,
      detailHref: `/admin/influencer-hub/branch-marketing/${r.id}`,
    })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

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
    sponsors: sponsorRows as IHInfluencerSponsorRow[],
    branchActivities,
    currentRates: (currentRatesRes.data ?? []).map(mapRate),
    rateHistory: (rateHistoryRes.data ?? []).map(mapRate),
    performanceItems,
    performance: {
      totalCollabs,
      totalViews,
      totalReactions,
      avgViews: viewsRows.length > 0 ? Math.round(totalViews / viewsRows.length) : null,
      avgReactions: reactionsRows.length > 0 ? Math.round(totalReactions / reactionsRows.length) : null,
      totalCost,
      cpv: totalViews > 0 ? Math.round(totalCost / totalViews) : null,
      cpe: totalReactions > 0 ? Math.round(totalCost / totalReactions) : null,
      totalLikes,
      totalComments,
      avgLikes: likesRows.length > 0 ? Math.round(totalLikes / likesRows.length) : null,
      avgComments: commentsRows.length > 0 ? Math.round(totalComments / commentsRows.length) : null,
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
  /** 제품 협찬 메이트/방문 인플루언서 고정 구분값 — Mobile Viewer에서 "최근 협찬" vs "최근 방문 활동" 섹션 노출 여부를 가른다. */
  collabTypes: ("SPONSOR" | "VISIT")[];
  sponsors: { id: number; product: string; round: number | null; status: string }[];
  branchActivities: {
    id: number;
    branchName: string | null;
    activityType: IHBranchActivityType;
    marketingDate: string | null;
    cost: number | null;
    description: string | null;
  }[];
  performance: {
    totalViews: number;
    totalReactions: number;
    cpv: number | null;
    cpe: number | null;
    totalLikes: number;
    totalComments: number;
  };
  /** 최신순 최대 5건 — Mobile Viewer는 "핵심 성과만 간결하게"만 보여주면 되므로 전체를 다 내려보내지 않는다(Phase 8). */
  recentPerformance: {
    id: number;
    source: "SPONSOR" | "BRANCH_MARKETING";
    label: string;
    date: string | null;
    views: number | null;
    likes: number | null;
    comments: number | null;
    contentUrl: string | null;
  }[];
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
  const { influencer, branchActivities, sponsors, performance, performanceItems, currentRates, rateHistory, memos } = detail;

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
    collabTypes: Array.isArray(influencer.collab_types) ? influencer.collab_types : [],
    sponsors: sponsors.map((s) => ({ id: s.id, product: s.product, round: s.round, status: s.status })),
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
      totalLikes: performance.totalLikes,
      totalComments: performance.totalComments,
    },
    recentPerformance: performanceItems.slice(0, 5).map((p) => ({
      id: p.id,
      source: p.source,
      label: p.label,
      date: p.date,
      views: p.views,
      likes: p.likes,
      comments: p.comments,
      contentUrl: p.contentUrl,
    })),
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
