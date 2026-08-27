import { createAdminClient } from "@/lib/supabase-server";
import { stripBranchPrefix, BRANCH_MKT_STATUS_ORDER, BRANDED_PPL_CATEGORY_LABEL, type IHBranchMktStatus } from "./influencer-shared";

// Influencer Hub Dashboard용 집계 함수 — 전부 읽기 전용(SELECT)이며, DB에 어떤 데이터도 쓰지 않는다.
// 데이터가 0건이어도 오류 없이 빈 값(0/null/[])을 반환해 Empty State로 이어지도록 한다.

const SPONSOR_STAGES = [
  "PLANNED",
  "SHIP_SCHEDULED",
  "SENT",
  "RECEIVED",
  "PRODUCING",
  "UPLOAD_SCHEDULED",
  "UPLOADED",
  "ENDED",
] as const;
export type SponsorStage = (typeof SPONSOR_STAGES)[number];

// "확인해야 할 마케팅" / "진행 중 마케팅" 공용 — 실제 데이터가 들어오면
// 인플루언서/제품/채널/팔로워/D-day/상태/확인필요 여부를 업무 리스트 형태로 보여준다.
// uploadDueDate 필드는 화면 맥락에 따라 발송예정일 등 다른 날짜가 들어올 수 있다(필드명은 컴포넌트 재사용을 위해 유지).
export type IHSponsorAttentionItem = {
  id: number;
  product: string;
  status: string;
  uploadDueDate: string | null;
  influencerNickname: string | null;
  channel: string | null;
  followerDisplay: string | null;
  /** 기준 날짜까지 남은 일수. 음수면 지연(D+n). null이면 날짜 미정. */
  daysRemaining: number | null;
  /** 지연(D+) 이거나 D-1/D-day처럼 임박한 경우 true — 리스트에서 시각적으로 강조한다. */
  needsAttention: boolean;
};

export type IHBranchMarketingListItem = {
  id: number;
  marketingDate: string | null;
  statusDate: string | null;
  cost: number | null;
  views: number | null;
  reactions: number | null;
  status: string;
  branchName: string | null;
  influencerNickname: string | null;
};

/** 2주 일정용 — 업로드완료/등록완료 이전의 모든 진행 단계를 다 보여준다(제품 협찬: 협찬예정~업로드예정,
 *  지점 마케팅: 방문예정~등록예정). date는 상태별로 가장 관련있는 날짜 하나로 미리 정리해서 내려준다. */
export type IHScheduleSponsorItem = {
  id: number;
  product: string;
  status: string;
  date: string | null;
  influencerNickname: string | null;
};
export type IHScheduleBranchItem = {
  id: number;
  branchName: string | null;
  status: string;
  date: string | null;
  influencerNickname: string | null;
};

export type IHDashboardData = {
  overview: {
    totalInfluencers: number;
    activeInfluencers: number;
    inProgressSponsors: number;
    uploadScheduledCount: number;
    thisMonthMarketingCount: number;
    thisMonthMarketingCost: number;
  };
  sponsorStatusBreakdown: Record<SponsorStage, number>;
  branchMktStatusBreakdown: Record<IHBranchMktStatus, number>;
  /** 확인해야 할 마케팅 — 방문예정(지점 마케팅)/발송예정(제품 협찬) 중 아직 오지 않은 미래건. 기간 제한 없음. */
  needsAttention: {
    branchMarketing: IHBranchMarketingListItem[];
    sponsors: IHSponsorAttentionItem[];
  };
  /** 진행 중 마케팅 — 방문완료(지점 마케팅)/제품발송(제품 협찬). */
  inProgress: {
    branchMarketing: IHBranchMarketingListItem[];
    sponsors: IHSponsorAttentionItem[];
  };
  performance: {
    totalViews: number;
    totalReactions: number;
    avgViews: number | null;
    cpv: number | null;
    cpe: number | null;
  };
  /** 2주 일정 — 업로드완료/등록완료 이전 모든 단계(기간 제한 없이 전체를 내려주고, 화면에서 14일치만 뽑아 쓴다). */
  schedule: {
    sponsors: IHScheduleSponsorItem[];
    branchMarketing: IHScheduleBranchItem[];
  };
};

function monthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export async function getIHDashboardData(): Promise<IHDashboardData> {
  const sb = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { start: monthStart, end: monthEnd } = monthRange();

  const [
    totalInfluencersRes,
    activeInfluencersRes,
    sponsorsStatusRes,
    sponsorsShipScheduledRes,
    sponsorsSentRes,
    branchMarketingRes,
    sponsorsScheduleRes,
  ] = await Promise.all([
    sb.from("ih_influencers").select("id", { count: "exact", head: true }),
    sb.from("ih_influencers").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    sb.from("ih_sponsors").select("status"),
    // 확인해야 할 마케팅(제품 협찬) — 발송예정 중 아직 오지 않은 미래건, 기간 제한 없음.
    sb
      .from("ih_sponsors")
      .select("id, product, status, send_date, ih_influencers(nickname, channel, follower_display)")
      .eq("status", "SHIP_SCHEDULED")
      .order("send_date", { ascending: true, nullsFirst: false }),
    // 진행 중 마케팅(제품 협찬) — 제품발송 상태.
    sb
      .from("ih_sponsors")
      .select("id, product, status, send_date, ih_influencers(nickname, channel, follower_display)")
      .eq("status", "SENT")
      .order("send_date", { ascending: false, nullsFirst: false })
      .limit(10),
    sb
      .from("ih_branch_marketing")
      .select(
        "id, branch_id, influencer_id, marketing_date, support_date, cost, views, reactions, status, stores(name), ih_influencers(nickname)"
      )
      .order("marketing_date", { ascending: false, nullsFirst: false })
      .limit(500),
    // 2주 일정용 — 제품 협찬은 업로드완료 이전 모든 단계(협찬예정~업로드예정)를 다 가져온다.
    sb
      .from("ih_sponsors")
      .select("id, product, status, send_date, upload_date, ih_influencers(nickname)")
      .in("status", ["PLANNED", "SHIP_SCHEDULED", "SENT", "UPLOAD_SCHEDULED"]),
  ]);

  // 협찬 status별 집계(6단계, 종료 제외) — 소규모 데이터라 JS에서 집계
  const sponsorStatusBreakdown = SPONSOR_STAGES.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {} as Record<SponsorStage, number>);
  let inProgressSponsors = 0;
  for (const row of sponsorsStatusRes.data ?? []) {
    if (row.status !== "ENDED") inProgressSponsors += 1;
    if ((SPONSOR_STAGES as readonly string[]).includes(row.status)) {
      sponsorStatusBreakdown[row.status as SponsorStage] += 1;
    }
  }

  type RawInfluencerEmbed = { nickname: string; channel: string | null; follower_display: string | null };
  const mapSponsorRow = (r: {
    id: number;
    product: string;
    status: string;
    send_date: string | null;
    ih_influencers: RawInfluencerEmbed | RawInfluencerEmbed[] | null;
  }): IHSponsorAttentionItem => {
    const inf = Array.isArray(r.ih_influencers) ? r.ih_influencers[0] : r.ih_influencers;
    let daysRemaining: number | null = null;
    if (r.send_date) {
      const due = new Date(r.send_date + "T00:00:00");
      const now = new Date(today + "T00:00:00");
      daysRemaining = Math.round((due.getTime() - now.getTime()) / 86400000);
    }
    return {
      id: r.id,
      product: r.product,
      status: r.status,
      uploadDueDate: r.send_date,
      influencerNickname: inf?.nickname ?? null,
      channel: inf?.channel ?? null,
      followerDisplay: inf?.follower_display ?? null,
      daysRemaining,
      needsAttention: daysRemaining != null && daysRemaining <= 1,
    };
  };

  type RawBranchMarketingRow = {
    id: number;
    branch_id: number | null;
    influencer_id: number | null;
    marketing_date: string | null;
    support_date: string | null;
    cost: number | null;
    views: number | null;
    reactions: number | null;
    status: string;
    stores: { name: string } | { name: string }[] | null;
    ih_influencers: { nickname: string } | { nickname: string }[] | null;
  };
  const allBranchMarketing = (branchMarketingRes.data ?? []) as unknown as RawBranchMarketingRow[];
  const thisMonthRows = allBranchMarketing.filter(
    (r) => r.marketing_date && r.marketing_date >= monthStart && r.marketing_date < monthEnd
  );

  const branchMktStatusBreakdown = BRANCH_MKT_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {} as Record<IHBranchMktStatus, number>);
  for (const r of allBranchMarketing) {
    if ((BRANCH_MKT_STATUS_ORDER as readonly string[]).includes(r.status)) {
      branchMktStatusBreakdown[r.status as IHBranchMktStatus] += 1;
    }
  }

  let totalViews = 0;
  let totalReactions = 0;
  let viewsRowCount = 0;
  for (const r of allBranchMarketing) {
    if (typeof r.views === "number") {
      totalViews += r.views;
      viewsRowCount += 1;
    }
    if (typeof r.reactions === "number") totalReactions += r.reactions;
  }

  const thisMonthCost = thisMonthRows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  const toBranchMarketingItem = (r: RawBranchMarketingRow): IHBranchMarketingListItem => ({
    id: r.id,
    marketingDate: r.marketing_date,
    statusDate: r.support_date,
    cost: r.cost,
    views: r.views,
    reactions: r.reactions,
    status: r.status,
    branchName: (() => {
      const n = Array.isArray(r.stores) ? r.stores[0]?.name : r.stores?.name;
      return n ? stripBranchPrefix(n) : null;
    })(),
    influencerNickname: Array.isArray(r.ih_influencers)
      ? r.ih_influencers[0]?.nickname ?? null
      : r.ih_influencers?.nickname ?? null,
  });

  // 확인해야 할 마케팅(지점 마케팅) — 방문예정 전체(지난 날짜도 포함, 기간 제한 없음). 상태 날짜 가까운/지난 순.
  const needsAttentionBranchMarketing = allBranchMarketing
    .filter((r) => r.status === "VISIT_SCHEDULED")
    .sort((a, b) => (a.support_date ?? "9999-99-99").localeCompare(b.support_date ?? "9999-99-99"))
    .map(toBranchMarketingItem);

  // 진행 중 마케팅(지점 마케팅) — 방문완료 상태, 최근 상태 날짜 순.
  const inProgressBranchMarketing = allBranchMarketing
    .filter((r) => r.status === "VISIT_COMPLETED")
    .sort((a, b) => (b.support_date ?? "").localeCompare(a.support_date ?? ""))
    .slice(0, 10)
    .map(toBranchMarketingItem);

  const totalCostForPerf = allBranchMarketing.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  // 2주 일정 — 제품 협찬: 협찬예정~업로드예정(업로드완료 이전 전체), 지점 마케팅: 방문예정~등록예정(등록완료 이전 전체).
  type SponsorScheduleRawRow = {
    id: number;
    product: string;
    status: string;
    send_date: string | null;
    upload_date: string | null;
    ih_influencers: RawInfluencerEmbed | RawInfluencerEmbed[] | null;
  };
  const scheduleSponsors: IHScheduleSponsorItem[] = ((sponsorsScheduleRes.data ?? []) as unknown as SponsorScheduleRawRow[]).map((r) => {
    const inf = Array.isArray(r.ih_influencers) ? r.ih_influencers[0] : r.ih_influencers;
    return {
      id: r.id,
      product: r.product,
      status: r.status,
      date: r.upload_date ?? r.send_date,
      influencerNickname: inf?.nickname ?? null,
    };
  });

  const scheduleBranchMarketing: IHScheduleBranchItem[] = allBranchMarketing
    .filter((r) => (["VISIT_SCHEDULED", "VISIT_COMPLETED", "REGISTRATION_SCHEDULED"] as string[]).includes(r.status))
    .map((r) => ({
      id: r.id,
      branchName: (() => {
        const n = Array.isArray(r.stores) ? r.stores[0]?.name : r.stores?.name;
        return n ? stripBranchPrefix(n) : null;
      })(),
      status: r.status,
      date: r.support_date ?? r.marketing_date,
      influencerNickname: Array.isArray(r.ih_influencers) ? r.ih_influencers[0]?.nickname ?? null : r.ih_influencers?.nickname ?? null,
    }));

  return {
    overview: {
      totalInfluencers: totalInfluencersRes.count ?? 0,
      activeInfluencers: activeInfluencersRes.count ?? 0,
      inProgressSponsors,
      uploadScheduledCount: sponsorStatusBreakdown.UPLOAD_SCHEDULED,
      thisMonthMarketingCount: thisMonthRows.length,
      thisMonthMarketingCost: thisMonthCost,
    },
    sponsorStatusBreakdown,
    branchMktStatusBreakdown,
    needsAttention: {
      branchMarketing: needsAttentionBranchMarketing,
      sponsors: (sponsorsShipScheduledRes.data ?? []).map(mapSponsorRow),
    },
    inProgress: {
      branchMarketing: inProgressBranchMarketing,
      sponsors: (sponsorsSentRes.data ?? []).map(mapSponsorRow),
    },
    performance: {
      totalViews,
      totalReactions,
      avgViews: viewsRowCount > 0 ? Math.round(totalViews / viewsRowCount) : null,
      cpv: totalViews > 0 ? Math.round(totalCostForPerf / totalViews) : null,
      cpe: totalReactions > 0 ? Math.round(totalCostForPerf / totalReactions) : null,
    },
    schedule: {
      sponsors: scheduleSponsors,
      branchMarketing: scheduleBranchMarketing,
    },
  };
}

// ── Phase 9: 통합 대시보드 — 전체 현황/성과 요약/기간별 유형별 현황/최근 활동.
// 위 getIHDashboardData()(확인해야 할 마케팅 등 액션 리스트)는 그대로 두고, 이 함수는 완전히 별도로 추가한다.
// 좋아요/댓글(likes/comments)은 Phase 8 migration 미실행 시 컬럼이 없을 수 있어 방어적으로 조회한다.

export type IHDashboardPeriod = "all" | "this_month" | "last_month" | "last_3_months" | "custom";

export type IHDashboardPeriodParams = {
  period: IHDashboardPeriod;
  /** period가 "custom"일 때만 사용 — YYYY-MM-DD, 둘 다 있어야 적용된다. */
  from?: string;
  to?: string;
};

/** 기간을 [start, end) 형태(end는 미포함, 다음날 자정)로 계산한다. period가 "all"이면 둘 다 null(필터 없음). */
function resolvePeriodRange(params: IHDashboardPeriodParams, now = new Date()): { start: string | null; end: string | null } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addDaysIso = (dateStr: string, days: number) => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    return iso(d);
  };

  switch (params.period) {
    case "this_month": {
      const { start, end } = monthRange(now);
      return { start, end };
    }
    case "last_month": {
      const lastMonthAnchor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const { start, end } = monthRange(lastMonthAnchor);
      return { start, end };
    }
    case "last_3_months": {
      const start = iso(new Date(now.getFullYear(), now.getMonth() - 2, 1));
      const end = iso(new Date(now.getFullYear(), now.getMonth() + 1, 1));
      return { start, end };
    }
    case "custom": {
      if (!params.from || !params.to) return { start: null, end: null };
      return { start: params.from, end: addDaysIso(params.to, 1) };
    }
    case "all":
    default:
      return { start: null, end: null };
  }
}

export type IHDashboardTypeStat = {
  count: number;
  cost: number;
  views: number | null;
  likes: number | null;
  comments: number | null;
};

/** "유형별 현황"의 비용 집계 기준 — PC/Mobile이 똑같은 문구를 쓰도록 한 곳에 모아둔다. */
export const DASHBOARD_TYPE_COST_CRITERIA = {
  sponsors: "제품 협찬: 업로드완료 건의 실제 업로드일 기준으로만 비용을 집계합니다.",
  branchMarketing: "지점 마케팅: 정산완료 건의 상태 날짜 기준으로만 비용을 집계합니다.",
  brandedPpl: "브랜디드/PPL: 종료 건만 비용을 집계합니다(협의중·확정 건은 제외). 조회수/좋아요/댓글은 집계하지 않습니다.",
} as const;

export type IHDashboardRecentSponsor = {
  id: number;
  product: string;
  status: string;
  date: string | null;
  influencerNickname: string | null;
};
export type IHDashboardRecentBranchMarketing = {
  id: number;
  branchName: string | null;
  status: string;
  date: string | null;
  influencerNickname: string | null;
};
export type IHDashboardRecentBrandedPpl = {
  id: number;
  name: string;
  category: string;
  categoryLabel: string;
  status: string;
  updatedAt: string;
};
export type IHDashboardRecentPerformanceUpdate = {
  id: number;
  source: "SPONSOR" | "BRANCH_MARKETING";
  label: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  updatedAt: string;
};

export type IHIntegratedDashboardData = {
  period: IHDashboardPeriod;
  resolvedRange: { start: string | null; end: string | null };
  /** 전체 현황 — 기간과 무관하게 항상 "현재 기준" 누적 수치. */
  overview: {
    totalInfluencers: number;
    activeInfluencers: number;
    inProgressCollabs: number;
    sponsorsCount: number;
    branchMarketingCount: number;
    brandedPplCount: number;
  };
  /** 성과 요약 — 선택된 기간 내 제품 협찬 + 지점 마케팅만 집계(브랜디드 PPL은 콘텐츠 성과 개념이 없어 제외). */
  performanceSummary: {
    totalCost: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgViews: number | null;
    cpv: number | null;
    cpe: number | null;
  };
  /** 유형별 현황 — 선택된 기간 기준. 브랜디드 PPL은 조회수/좋아요/댓글 개념이 없어 null로 둔다. */
  byType: {
    sponsors: IHDashboardTypeStat;
    branchMarketing: IHDashboardTypeStat;
    brandedPpl: IHDashboardTypeStat;
  };
  /** 최근 활동 — 기간 필터와 무관하게 항상 최신순 N건("최근"의 의미를 유지하기 위함). */
  recent: {
    sponsors: IHDashboardRecentSponsor[];
    branchMarketing: IHDashboardRecentBranchMarketing[];
    brandedPpl: IHDashboardRecentBrandedPpl[];
    performanceUpdates: IHDashboardRecentPerformanceUpdate[];
  };
};

const RECENT_LIMIT = 5;

export async function getIHIntegratedDashboardData(params: IHDashboardPeriodParams): Promise<IHIntegratedDashboardData> {
  const sb = createAdminClient();
  const { start, end } = resolvePeriodRange(params);

  const [
    totalInfluencersRes,
    activeInfluencersRes,
    sponsorsAllCountRes,
    branchMarketingAllCountRes,
    brandedPplAllCountRes,
    sponsorsInProgressCountRes,
    branchMarketingInProgressCountRes,
  ] = await Promise.all([
    sb.from("ih_influencers").select("id", { count: "exact", head: true }),
    sb.from("ih_influencers").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    sb.from("ih_sponsors").select("id", { count: "exact", head: true }),
    sb.from("ih_branch_marketing").select("id", { count: "exact", head: true }),
    // 브랜디드/PPL은 협의중 건까지 다 세면 실제로 잡히지 않을 수도 있는 견적까지 포함되니, 확정된 건만 센다.
    sb.from("ih_branded_ppl").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED"),
    // 진행 중 = 아직 최종 단계(업로드 완료/종료, 등록완료)에 이르지 않은 건.
    sb.from("ih_sponsors").select("id", { count: "exact", head: true }).not("status", "in", "(UPLOADED,ENDED)"),
    sb.from("ih_branch_marketing").select("id", { count: "exact", head: true }).neq("status", "REGISTRATION_COMPLETED"),
  ]);

  // 좋아요/댓글 컬럼(Phase 8)은 없을 수 있어 방어적으로 조회한다 — 전체 컬럼 시도 후 실패하면 뺀다.
  type SponsorPeriodRow = {
    id: number;
    product: string;
    status: string;
    send_date: string | null;
    cost: number | null;
    views: number | null;
    likes: number | null;
    comments: number | null;
    updated_at: string;
    ih_influencers: { nickname: string } | { nickname: string }[] | null;
  };
  const fetchSponsorsForPeriod = async (): Promise<SponsorPeriodRow[]> => {
    let q = sb.from("ih_sponsors").select("id, product, status, send_date, cost, views, likes, comments, updated_at, ih_influencers(nickname)");
    if (start) q = q.gte("send_date", start);
    if (end) q = q.lt("send_date", end);
    const full = await q;
    if (!full.error) return (full.data ?? []) as unknown as SponsorPeriodRow[];
    if (!/column .* does not exist/i.test(full.error.message)) throw full.error;

    let q2 = sb.from("ih_sponsors").select("id, product, status, send_date, cost, views, updated_at, ih_influencers(nickname)");
    if (start) q2 = q2.gte("send_date", start);
    if (end) q2 = q2.lt("send_date", end);
    const base = await q2;
    if (base.error) throw base.error;
    return ((base.data ?? []) as unknown as Omit<SponsorPeriodRow, "likes" | "comments">[]).map((r) => ({ ...r, likes: null, comments: null }));
  };

  type BranchPeriodRow = {
    id: number;
    branch_id: number | null;
    status: string;
    marketing_date: string | null;
    cost: number | null;
    views: number | null;
    reactions: number | null;
    comments: number | null;
    updated_at: string;
    stores: { name: string } | { name: string }[] | null;
    ih_influencers: { nickname: string } | { nickname: string }[] | null;
  };
  const fetchBranchMarketingForPeriod = async (): Promise<BranchPeriodRow[]> => {
    let q = sb
      .from("ih_branch_marketing")
      .select("id, branch_id, status, marketing_date, cost, views, reactions, comments, updated_at, stores(name), ih_influencers(nickname)");
    if (start) q = q.gte("marketing_date", start);
    if (end) q = q.lt("marketing_date", end);
    const full = await q;
    if (!full.error) return (full.data ?? []) as unknown as BranchPeriodRow[];
    if (!/column .* does not exist/i.test(full.error.message)) throw full.error;

    let q2 = sb
      .from("ih_branch_marketing")
      .select("id, branch_id, status, marketing_date, cost, views, reactions, updated_at, stores(name), ih_influencers(nickname)");
    if (start) q2 = q2.gte("marketing_date", start);
    if (end) q2 = q2.lt("marketing_date", end);
    const base = await q2;
    if (base.error) throw base.error;
    return ((base.data ?? []) as unknown as Omit<BranchPeriodRow, "comments">[]).map((r) => ({ ...r, comments: null }));
  };

  // 브랜디드 PPL엔 진행 날짜 개념이 없어(예상 견적 리스트), "이 기간에 등록된 건"을 created_at 기준으로 잡는다.
  const fetchBrandedPplForPeriod = async () => {
    let q = sb.from("ih_branded_ppl").select("id, category, name, cost, status, created_at, updated_at");
    if (start) q = q.gte("created_at", start);
    if (end) q = q.lt("created_at", end);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  };

  // 유형별 현황의 "비용"은 실제로 마무리(완료)된 건만 집계한다 — 진행 중 건의 비용까지 더하면 과대집계되므로.
  //   제품 협찬: 업로드완료 상태 + 실제 업로드일(upload_date)이 기간 안에 드는 건만.
  //   지점 마케팅: 정산완료 상태 + 상태 날짜(support_date, 정산완료로 바뀐 시점)가 기간 안에 드는 건만.
  //   브랜디드 PPL: 종료 상태인 건만(등록일 기준 기간 필터는 그대로 유지).
  const fetchSponsorCostForPeriod = async (): Promise<number> => {
    let q = sb.from("ih_sponsors").select("cost, upload_date").eq("status", "UPLOADED");
    if (start) q = q.gte("upload_date", start);
    if (end) q = q.lt("upload_date", end);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).reduce((s, r) => s + (r.cost ?? 0), 0);
  };
  const fetchBranchCostForPeriod = async (): Promise<number> => {
    // SETTLEMENT_COMPLETED는 이 값을 CHECK 제약에 추가하는 migration 실행 전에는 어떤 행도 가질 수 없는 값이라,
    // migration 미실행 상태에서는 그냥 결과가 0건으로 나온다(에러 아님) — 별도 방어 불필요.
    let q = sb.from("ih_branch_marketing").select("cost, support_date").eq("status", "SETTLEMENT_COMPLETED");
    if (start) q = q.gte("support_date", start);
    if (end) q = q.lt("support_date", end);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).reduce((s, r) => s + (r.cost ?? 0), 0);
  };

  const [sponsorRows, branchRows, pplRows, sponsorCostCompleted, branchCostCompleted] = await Promise.all([
    fetchSponsorsForPeriod(),
    fetchBranchMarketingForPeriod(),
    fetchBrandedPplForPeriod(),
    fetchSponsorCostForPeriod(),
    fetchBranchCostForPeriod(),
  ]);

  type SponsorInfEmbed = { nickname: string } | { nickname: string }[] | null;
  type BranchInfEmbed = { nickname: string } | { nickname: string }[] | null;
  type BranchStoreEmbed = { name: string } | { name: string }[] | null;
  const firstOf = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  const sponsorViewsRows = sponsorRows.filter((r) => r.views != null);
  const sponsorViews = sponsorViewsRows.reduce((s, r) => s + (r.views ?? 0), 0);
  const sponsorLikes = sponsorRows.reduce((s, r) => s + (r.likes ?? 0), 0);
  const sponsorComments = sponsorRows.reduce((s, r) => s + (r.comments ?? 0), 0);

  const branchViewsRows = branchRows.filter((r) => r.views != null);
  const branchViews = branchViewsRows.reduce((s, r) => s + (r.views ?? 0), 0);
  const branchLikes = branchRows.reduce((s, r) => s + (r.reactions ?? 0), 0); // 반응수 = 좋아요와 같은 의미로 취급(Phase 8)
  const branchComments = branchRows.reduce((s, r) => s + (r.comments ?? 0), 0);

  // 브랜디드 PPL 비용도 종료(ENDED) 건만 유형별 현황에 집계한다 — 협의중/확정 단계는 아직 실제 집행이 아니라서.
  const pplCostCompleted = pplRows.filter((r) => r.status === "ENDED").reduce((s, r) => s + (r.cost ?? 0), 0);

  // "총 비용"은 유형별 현황과 반드시 같은 기준을 써야 한다 — 완료 상태(제품 협찬: 업로드완료, 지점 마케팅:
  // 정산완료, 브랜디드/PPL: 종료) 건만 더한다. 진행 중 건까지 더하면 과대집계된다.
  const totalCost = sponsorCostCompleted + branchCostCompleted + pplCostCompleted;
  const totalViews = sponsorViews + branchViews;
  const totalLikes = sponsorLikes + branchLikes;
  const totalComments = sponsorComments + branchComments;
  const totalViewsRowCount = sponsorViewsRows.length + branchViewsRows.length;
  const totalEngagement = totalLikes + totalComments;

  // 최근 활동은 기간 필터와 무관하게 항상 최신 N건 — 별도로 다시 조회한다(위 period 조회는 기간이 좁으면 비어있을 수 있어서).
  const [recentSponsorsRes, recentBranchRes, recentPplRes, recentSponsorPerfRes, recentBranchPerfRes] = await Promise.all([
    sb.from("ih_sponsors").select("id, product, status, send_date, created_at, ih_influencers(nickname)").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    sb
      .from("ih_branch_marketing")
      .select("id, status, marketing_date, created_at, stores(name), ih_influencers(nickname)")
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    sb.from("ih_branded_ppl").select("id, category, name, status, updated_at").order("updated_at", { ascending: false }).limit(RECENT_LIMIT),
    sb.from("ih_sponsors").select("id, product, views, likes, comments, updated_at").not("views", "is", null).order("updated_at", { ascending: false }).limit(RECENT_LIMIT),
    sb.from("ih_branch_marketing").select("id, status, views, reactions, comments, updated_at, stores(name)").not("views", "is", null).order("updated_at", { ascending: false }).limit(RECENT_LIMIT),
  ]);

  const recentSponsors: IHDashboardRecentSponsor[] = (recentSponsorsRes.data ?? []).map((r) => ({
    id: r.id,
    product: r.product,
    status: r.status,
    date: r.send_date,
    influencerNickname: firstOf(r.ih_influencers as SponsorInfEmbed)?.nickname ?? null,
  }));

  const recentBranchMarketing: IHDashboardRecentBranchMarketing[] = (recentBranchRes.data ?? []).map((r) => ({
    id: r.id,
    branchName: (() => {
      const n = firstOf(r.stores as BranchStoreEmbed)?.name;
      return n ? stripBranchPrefix(n) : null;
    })(),
    status: r.status,
    date: r.marketing_date,
    influencerNickname: firstOf(r.ih_influencers as BranchInfEmbed)?.nickname ?? null,
  }));

  const recentBrandedPpl: IHDashboardRecentBrandedPpl[] = (recentPplRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    categoryLabel: BRANDED_PPL_CATEGORY_LABEL[r.category] ?? r.category,
    status: r.status,
    updatedAt: r.updated_at,
  }));

  // 제품 협찬/지점 마케팅 성과 업데이트를 합쳐 최신순 상위 N건만 남긴다.
  const perfUpdates: IHDashboardRecentPerformanceUpdate[] = [
    ...(recentSponsorPerfRes.data ?? []).map(
      (r): IHDashboardRecentPerformanceUpdate => ({
        id: r.id,
        source: "SPONSOR",
        label: r.product,
        views: r.views,
        likes: (r as { likes?: number | null }).likes ?? null,
        comments: (r as { comments?: number | null }).comments ?? null,
        updatedAt: r.updated_at,
      })
    ),
    ...(recentBranchPerfRes.data ?? []).map((r): IHDashboardRecentPerformanceUpdate => {
      const branchName = firstOf(r.stores as BranchStoreEmbed)?.name;
      return {
        id: r.id,
        source: "BRANCH_MARKETING",
        label: branchName ? stripBranchPrefix(branchName) : "-",
        views: r.views,
        likes: r.reactions,
        comments: (r as { comments?: number | null }).comments ?? null,
        updatedAt: r.updated_at,
      };
    }),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_LIMIT);

  return {
    period: params.period,
    resolvedRange: { start, end },
    overview: {
      totalInfluencers: totalInfluencersRes.count ?? 0,
      activeInfluencers: activeInfluencersRes.count ?? 0,
      inProgressCollabs: (sponsorsInProgressCountRes.count ?? 0) + (branchMarketingInProgressCountRes.count ?? 0),
      sponsorsCount: sponsorsAllCountRes.count ?? 0,
      branchMarketingCount: branchMarketingAllCountRes.count ?? 0,
      brandedPplCount: brandedPplAllCountRes.count ?? 0,
    },
    performanceSummary: {
      totalCost,
      totalViews,
      totalLikes,
      totalComments,
      avgViews: totalViewsRowCount > 0 ? Math.round(totalViews / totalViewsRowCount) : null,
      cpv: totalViews > 0 ? Math.round(totalCost / totalViews) : null,
      cpe: totalEngagement > 0 ? Math.round(totalCost / totalEngagement) : null,
    },
    byType: {
      sponsors: { count: sponsorRows.length, cost: sponsorCostCompleted, views: sponsorViews, likes: sponsorLikes, comments: sponsorComments },
      branchMarketing: { count: branchRows.length, cost: branchCostCompleted, views: branchViews, likes: branchLikes, comments: branchComments },
      brandedPpl: { count: pplRows.length, cost: pplCostCompleted, views: null, likes: null, comments: null },
    },
    recent: {
      sponsors: recentSponsors,
      branchMarketing: recentBranchMarketing,
      brandedPpl: recentBrandedPpl,
      performanceUpdates: perfUpdates,
    },
  };
}
