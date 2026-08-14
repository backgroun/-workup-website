import { createAdminClient } from "@/lib/supabase-server";

// Influencer Hub Dashboard용 집계 함수 — 전부 읽기 전용(SELECT)이며, DB에 어떤 데이터도 쓰지 않는다.
// 데이터가 0건이어도 오류 없이 빈 값(0/null/[])을 반환해 Empty State로 이어지도록 한다.

const SPONSOR_STAGES = [
  "PLANNED",
  "SENT",
  "RECEIVED",
  "PRODUCING",
  "UPLOAD_SCHEDULED",
  "UPLOADED",
] as const;
export type SponsorStage = (typeof SPONSOR_STAGES)[number];

// "이번 주 확인해야 할 협찬" / "업로드 예정" 공용 — 실제 데이터가 들어오면
// 인플루언서/제품/채널/팔로워/D-day/상태/확인필요 여부를 업무 리스트 형태로 보여준다.
export type IHSponsorAttentionItem = {
  id: number;
  product: string;
  status: string;
  uploadDueDate: string | null;
  influencerNickname: string | null;
  channel: string | null;
  followerDisplay: string | null;
  /** upload_due_date 기준 남은 일수. 음수면 지연(D+n). null이면 예정일 미정. */
  daysRemaining: number | null;
  /** 지연(D+) 이거나 D-1/D-day처럼 임박한 경우 true — 리스트에서 시각적으로 강조한다. */
  needsAttention: boolean;
};

export type IHBranchMarketingListItem = {
  id: number;
  marketingDate: string | null;
  cost: number | null;
  views: number | null;
  reactions: number | null;
  status: string;
  branchName: string | null;
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
  influencerBreakdown: {
    all: number;
    productSponsors: number;
    branchPool: number;
    brandedPpl: number;
  };
  sponsorStatusBreakdown: Record<SponsorStage, number>;
  needsAttentionThisWeek: IHSponsorAttentionItem[];
  uploadScheduled: IHSponsorAttentionItem[];
  recentBranchMarketing: IHBranchMarketingListItem[];
  branchTotals: { branchId: number; branchName: string; count: number; cost: number }[];
  performance: {
    totalViews: number;
    totalReactions: number;
    avgViews: number | null;
    cpv: number | null;
    cpe: number | null;
  };
};

function monthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function weekAheadISO(now = new Date()) {
  const d = new Date(now.getTime() + 7 * 86400000);
  return d.toISOString().slice(0, 10);
}

export async function getIHDashboardData(): Promise<IHDashboardData> {
  const sb = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { start: monthStart, end: monthEnd } = monthRange();
  const weekAhead = weekAheadISO();

  const [
    totalInfluencersRes,
    activeInfluencersRes,
    productSponsorsRes,
    branchPoolRes,
    modelsCountRes,
    channelsCountRes,
    sponsorsStatusRes,
    needsAttentionRes,
    uploadScheduledRes,
    branchMarketingRes,
  ] = await Promise.all([
    sb.from("ih_influencers").select("id", { count: "exact", head: true }),
    sb.from("ih_influencers").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    sb.from("ih_influencers").select("id", { count: "exact", head: true }).eq("source_sheet", "제품협찬자들"),
    sb.from("ih_influencers").select("id", { count: "exact", head: true }).eq("source_sheet", "지점홍보인플"),
    sb.from("ih_models").select("id", { count: "exact", head: true }),
    sb.from("ih_branded_channels").select("id", { count: "exact", head: true }),
    sb.from("ih_sponsors").select("status"),
    sb
      .from("ih_sponsors")
      .select("id, product, status, upload_due_date, ih_influencers(nickname, channel, follower_display)")
      .neq("status", "ENDED")
      .lte("upload_due_date", weekAhead)
      .order("upload_due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    sb
      .from("ih_sponsors")
      .select("id, product, status, upload_due_date, ih_influencers(nickname, channel, follower_display)")
      .eq("status", "UPLOAD_SCHEDULED")
      .order("upload_due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    sb
      .from("ih_branch_marketing")
      .select(
        "id, branch_id, influencer_id, marketing_date, cost, views, reactions, status, ih_branches(branch_name), ih_influencers(nickname)"
      )
      .order("marketing_date", { ascending: false, nullsFirst: false })
      .limit(500),
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
    upload_due_date: string | null;
    ih_influencers: RawInfluencerEmbed | RawInfluencerEmbed[] | null;
  }): IHSponsorAttentionItem => {
    const inf = Array.isArray(r.ih_influencers) ? r.ih_influencers[0] : r.ih_influencers;
    let daysRemaining: number | null = null;
    if (r.upload_due_date) {
      const due = new Date(r.upload_due_date + "T00:00:00");
      const now = new Date(today + "T00:00:00");
      daysRemaining = Math.round((due.getTime() - now.getTime()) / 86400000);
    }
    return {
      id: r.id,
      product: r.product,
      status: r.status,
      uploadDueDate: r.upload_due_date,
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
    cost: number | null;
    views: number | null;
    reactions: number | null;
    status: string;
    ih_branches: { branch_name: string } | { branch_name: string }[] | null;
    ih_influencers: { nickname: string } | { nickname: string }[] | null;
  };
  const allBranchMarketing = (branchMarketingRes.data ?? []) as unknown as RawBranchMarketingRow[];
  const thisMonthRows = allBranchMarketing.filter(
    (r) => r.marketing_date && r.marketing_date >= monthStart && r.marketing_date < monthEnd
  );

  const branchTotalsMap = new Map<number, { branchName: string; count: number; cost: number }>();
  let totalViews = 0;
  let totalReactions = 0;
  let viewsRowCount = 0;
  for (const r of allBranchMarketing) {
    const branchName = Array.isArray(r.ih_branches) ? r.ih_branches[0]?.branch_name : r.ih_branches?.branch_name;
    if (r.branch_id != null) {
      const cur = branchTotalsMap.get(r.branch_id) ?? { branchName: branchName ?? "-", count: 0, cost: 0 };
      cur.count += 1;
      cur.cost += r.cost ?? 0;
      branchTotalsMap.set(r.branch_id, cur);
    }
    if (typeof r.views === "number") {
      totalViews += r.views;
      viewsRowCount += 1;
    }
    if (typeof r.reactions === "number") totalReactions += r.reactions;
  }
  const branchTotals = [...branchTotalsMap.entries()]
    .map(([branchId, v]) => ({ branchId, branchName: v.branchName, count: v.count, cost: v.cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const thisMonthCost = thisMonthRows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  const recentBranchMarketing: IHBranchMarketingListItem[] = allBranchMarketing.slice(0, 5).map((r) => ({
    id: r.id,
    marketingDate: r.marketing_date,
    cost: r.cost,
    views: r.views,
    reactions: r.reactions,
    status: r.status,
    branchName: Array.isArray(r.ih_branches) ? r.ih_branches[0]?.branch_name ?? null : r.ih_branches?.branch_name ?? null,
    influencerNickname: Array.isArray(r.ih_influencers)
      ? r.ih_influencers[0]?.nickname ?? null
      : r.ih_influencers?.nickname ?? null,
  }));

  const totalCostForPerf = allBranchMarketing.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return {
    overview: {
      totalInfluencers: totalInfluencersRes.count ?? 0,
      activeInfluencers: activeInfluencersRes.count ?? 0,
      inProgressSponsors,
      uploadScheduledCount: sponsorStatusBreakdown.UPLOAD_SCHEDULED,
      thisMonthMarketingCount: thisMonthRows.length,
      thisMonthMarketingCost: thisMonthCost,
    },
    influencerBreakdown: {
      all: totalInfluencersRes.count ?? 0,
      productSponsors: productSponsorsRes.count ?? 0,
      branchPool: branchPoolRes.count ?? 0,
      brandedPpl: (modelsCountRes.count ?? 0) + (channelsCountRes.count ?? 0),
    },
    sponsorStatusBreakdown,
    needsAttentionThisWeek: (needsAttentionRes.data ?? []).map(mapSponsorRow),
    uploadScheduled: (uploadScheduledRes.data ?? []).map(mapSponsorRow),
    recentBranchMarketing,
    branchTotals,
    performance: {
      totalViews,
      totalReactions,
      avgViews: viewsRowCount > 0 ? Math.round(totalViews / viewsRowCount) : null,
      cpv: totalViews > 0 ? Math.round(totalCostForPerf / totalViews) : null,
      cpe: totalReactions > 0 ? Math.round(totalCostForPerf / totalReactions) : null,
    },
  };
}
