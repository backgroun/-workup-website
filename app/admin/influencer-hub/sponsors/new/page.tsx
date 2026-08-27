import Link from "next/link";
import IHSponsorForm from "@/components/ih/sponsors/IHSponsorForm";

export default async function IHSponsorNewPage({ searchParams }: { searchParams: Promise<{ influencerId?: string }> }) {
  const sp = await searchParams;
  const initialInfluencerId = sp.influencerId ? Number(sp.influencerId) : undefined;

  return (
    <div>
      <Link href="/admin/influencer-hub/sponsors" className="inline-flex items-center gap-1 text-[13.5px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        제품 협찬
      </Link>
      <h1 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">협찬 등록</h1>
      <IHSponsorForm mode="create" initialInfluencerId={Number.isFinite(initialInfluencerId) ? initialInfluencerId : undefined} />
    </div>
  );
}
