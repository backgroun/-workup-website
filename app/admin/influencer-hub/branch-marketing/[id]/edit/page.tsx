import { notFound } from "next/navigation";
import Link from "next/link";
import { getBranchMarketingDetail } from "@/lib/ih/collabs";
import IHBranchMarketingForm from "@/components/ih/branch-marketing/IHBranchMarketingForm";

export default async function IHBranchMarketingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const detail = await getBranchMarketingDetail(id);
  if (!detail) notFound();

  return (
    <div>
      <Link href={`/admin/influencer-hub/branch-marketing/${id}`} className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        지점 마케팅 상세
      </Link>
      <h1 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">마케팅 정보 수정</h1>
      <IHBranchMarketingForm mode="edit" detail={detail} />
    </div>
  );
}
