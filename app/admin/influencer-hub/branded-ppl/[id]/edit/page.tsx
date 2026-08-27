import { notFound } from "next/navigation";
import Link from "next/link";
import { getBrandedPplDetail } from "@/lib/ih/collabs";
import IHBrandedPplForm from "@/components/ih/branded-ppl/IHBrandedPplForm";

export default async function IHBrandedPplEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const detail = await getBrandedPplDetail(id);
  if (!detail) notFound();

  return (
    <div>
      <Link href={`/admin/influencer-hub/branded-ppl/${id}`} className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        PPL 상세
      </Link>
      <h1 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">PPL 정보 수정</h1>
      <IHBrandedPplForm mode="edit" detail={detail} />
    </div>
  );
}
