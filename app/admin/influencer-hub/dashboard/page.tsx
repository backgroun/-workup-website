import IHPageHeader from "@/components/ih/IHPageHeader";
import { IHListSection, IHBranchMarketingList } from "@/components/ih/dashboard/IHPriorityList";
import IHUploadSchedule from "@/components/ih/dashboard/IHUploadSchedule";
import IHScheduleAgendaSection from "@/components/ih/dashboard/IHScheduleAgendaSection";
import IHMobileDashboardSync from "@/components/ih/dashboard/IHMobileDashboardSync";
import IHIntegratedDashboard from "@/components/ih/dashboard/IHIntegratedDashboard";
import { getIHDashboardData, getIHIntegratedDashboardData } from "@/lib/ih/dashboard";

// Dashboard는 실제 Supabase DB를 읽어 표시한다(Excel Import 전까지는 대부분 0/빈 값 — 정상).
// 정보 우선순위: 1.통합 대시보드(Phase 9 — 전체 현황/성과 요약/기간별 유형별 현황)
//              2.확인해야 할 마케팅(지점/제품 협찬) 3.진행 중 마케팅(지점/제품 협찬) 4.2주 일정
// 기존 "전체 현황" KPI 타일은 통합 대시보드 상단과 중복돼 제거했다. 우측 "제품 협찬 현황/지점 방문 현황/성과"
// 패널도 2주 일정(캘린더형 스케줄)으로 대체했다 — 둘 다 요청에 따른 변경.
export default async function IHDashboardPage() {
  const [data, integratedData] = await Promise.all([
    getIHDashboardData(),
    getIHIntegratedDashboardData({ period: "this_month" }),
  ]);

  return (
    <div>
      <IHMobileDashboardSync data={data} />
      <IHPageHeader
        breadcrumb={["Influencer Hub", "Dashboard"]}
        title="Dashboard"
        description="확인해야 할 마케팅과 진행 중인 마케팅부터, 인플루언서·성과 현황까지 한눈에 봅니다."
      />

      {/* 통합 대시보드(Phase 9) */}
      <div className="mb-6">
        <IHIntegratedDashboard initialData={integratedData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 2~3. Action / Attention 영역 — Dashboard의 핵심 */}
        <div className="space-y-4">
          <IHListSection title="확인해야 할 마케팅">
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-2.5 text-[13px] font-semibold text-sky-700 bg-sky-50">지점 마케팅 · 방문예정</div>
              <IHBranchMarketingList items={data.needsAttention.branchMarketing} bare emptyMessage="방문예정인 지점 마케팅이 없습니다" />
              <div className="px-4 py-2.5 text-[13px] font-semibold text-indigo-700 bg-indigo-50">제품 협찬 · 발송예정</div>
              <IHUploadSchedule items={data.needsAttention.sponsors} emptyMessage="발송예정인 협찬이 없습니다" />
            </div>
          </IHListSection>

          <IHListSection title="진행 중 마케팅">
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-2.5 text-[13px] font-semibold text-emerald-700 bg-emerald-50">지점 마케팅 · 방문완료</div>
              <IHBranchMarketingList items={data.inProgress.branchMarketing} bare emptyMessage="방문완료된 지점 마케팅이 없습니다" />
              <div className="px-4 py-2.5 text-[13px] font-semibold text-sky-700 bg-sky-50">제품 협찬 · 제품발송</div>
              <IHUploadSchedule items={data.inProgress.sponsors} emptyMessage="발송된 협찬이 없습니다" />
            </div>
          </IHListSection>
        </div>

        {/* 4. 2주 일정 — 기존 "제품 협찬 현황/지점 방문 현황/성과" 패널을 대체 */}
        <div className="space-y-4">
          <IHScheduleAgendaSection branchMarketing={data.schedule.branchMarketing} sponsors={data.schedule.sponsors} />
        </div>
      </div>
    </div>
  );
}
