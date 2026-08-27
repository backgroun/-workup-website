import Link from "next/link";
import IHBranchMarketingForm from "@/components/ih/branch-marketing/IHBranchMarketingForm";

export default async function IHBranchMarketingNewPage({ searchParams }: { searchParams: Promise<{ influencerId?: string }> }) {
  const sp = await searchParams;
  const initialInfluencerId = sp.influencerId ? Number(sp.influencerId) : undefined;

  return (
    <div>
      <Link href="/admin/influencer-hub/branch-marketing" className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        지점 마케팅
      </Link>
      <h1 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">마케팅 등록</h1>
      <IHBranchMarketingForm mode="create" initialInfluencerId={Number.isFinite(initialInfluencerId) ? initialInfluencerId : undefined} />
    </div>
  );
}
