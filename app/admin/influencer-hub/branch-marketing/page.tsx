import Link from "next/link";
import IHBranchMarketingListClient from "@/components/ih/branch-marketing/IHBranchMarketingListClient";
import IHBranchMarketingExportButton from "@/components/ih/branch-marketing/IHBranchMarketingExportButton";
import IHBranchMarketingCalendarSection from "@/components/ih/branch-marketing/IHBranchMarketingCalendarSection";
import { getIHDashboardData } from "@/lib/ih/dashboard";

export default async function IHBranchMarketingPage() {
  const data = await getIHDashboardData();
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <nav className="text-[12.5px] text-slate-500 mb-1.5">Influencer Hub · 지점 마케팅</nav>
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">지점 마케팅</h1>
          <p className="mt-1 text-[14px] text-slate-600">지점별 마케팅 집행 현황 · 등록 · 성과 확인</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <IHBranchMarketingExportButton />
          <Link
            href="/admin/influencer-hub/branch-marketing/import"
            className="rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-[14px] font-semibold px-4 py-2 transition-colors"
          >
            Excel 업로드
          </Link>
          <Link
            href="/admin/influencer-hub/branch-marketing/new"
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 shadow-sm transition-colors"
          >
            + 마케팅 등록
          </Link>
        </div>
      </div>

      <IHBranchMarketingCalendarSection branchMarketing={data.schedule.branchMarketing} />

      <IHBranchMarketingListClient />
    </div>
  );
}
