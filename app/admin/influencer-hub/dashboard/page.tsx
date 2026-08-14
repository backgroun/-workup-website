import IHPageHeader from "@/components/ih/IHPageHeader";
import IHKpiTiles from "@/components/ih/dashboard/IHKpiTiles";
import { IHListSection, IHBranchMarketingList } from "@/components/ih/dashboard/IHPriorityList";
import IHSponsorAttentionTable from "@/components/ih/dashboard/IHSponsorAttentionTable";
import IHUploadSchedule from "@/components/ih/dashboard/IHUploadSchedule";
import {
  IHInfluencerBreakdownPanel,
  IHSponsorStatusPanel,
  IHBranchTotalsPanel,
  IHPerformancePanel,
} from "@/components/ih/dashboard/IHDashboardPanels";
import { getIHDashboardData } from "@/lib/ih/dashboard";

// Dashboard는 실제 Supabase DB를 읽어 표시한다(Excel Import 전까지는 대부분 0/빈 값 — 정상).
// 정보 우선순위: 1.KPI 2.이번 주 확인해야 할 협찬 3.업로드 예정 4.최근 지점 마케팅
//              5.인플루언서 현황 6.제품 협찬 현황 7.지점별 집행 8.비용/성과
export default async function IHDashboardPage() {
  const data = await getIHDashboardData();

  return (
    <div>
      <IHPageHeader
        breadcrumb={["Influencer Hub", "Dashboard"]}
        title="Dashboard"
        description="오늘 확인해야 할 협찬과 지점 마케팅부터, 인플루언서·성과 현황까지 한눈에 봅니다."
      />

      {/* 1. KPI / 전체 현황 — 보조 요약, Action 영역보다 절제된 톤 */}
      <IHKpiTiles overview={data.overview} />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 2~4. Action / Attention 영역 — Dashboard의 핵심 */}
        <div className="lg:col-span-2 space-y-4">
          <IHListSection title="이번 주 확인해야 할 협찬" subtitle="업로드 예정일이 임박했거나 지연된 협찬">
            <IHSponsorAttentionTable items={data.needsAttentionThisWeek} />
          </IHListSection>

          <IHListSection title="업로드 예정">
            <IHUploadSchedule items={data.uploadScheduled} />
          </IHListSection>

          <IHBranchMarketingList items={data.recentBranchMarketing} />
        </div>

        {/* 5~8. 현황/성과 요약 */}
        <div className="space-y-4">
          <IHInfluencerBreakdownPanel breakdown={data.influencerBreakdown} />
          <IHSponsorStatusPanel breakdown={data.sponsorStatusBreakdown} />
          <IHBranchTotalsPanel branchTotals={data.branchTotals} />
          <IHPerformancePanel performance={data.performance} />
        </div>
      </div>
    </div>
  );
}
