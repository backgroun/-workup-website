import { notFound } from "next/navigation";
import Link from "next/link";
import { getSponsorDetail } from "@/lib/ih/collabs";
import IHSponsorForm from "@/components/ih/sponsors/IHSponsorForm";

export default async function IHSponsorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();

  return (
    <div>
      <Link href={`/admin/influencer-hub/sponsors/${id}`} className="inline-flex items-center gap-1 text-[13.5px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        협찬 상세
      </Link>
      <h1 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">협찬 수정</h1>
      <IHSponsorForm mode="edit" sponsor={sponsor} />
    </div>
  );
}
