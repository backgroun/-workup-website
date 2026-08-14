import Link from "next/link";
import IHInfluencerListClient from "@/components/ih/influencers/IHInfluencerListClient";
import IHDuplicateCandidatesPanel from "@/components/ih/influencers/IHDuplicateCandidatesPanel";

export default function IHInfluencersPage() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <nav className="text-[12px] text-slate-400 mb-1.5">Influencer Hub · 인플루언서</nav>
          <h1 className="text-[19px] font-bold text-slate-900 tracking-tight">인플루언서</h1>
          <p className="mt-1 text-[13px] text-slate-500">전체 인플루언서 DB · 검색 · 필터 · 상세</p>
        </div>
        <Link
          href="/admin/influencer-hub/influencers/new"
          className="flex-shrink-0 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 shadow-sm transition-colors"
        >
          + 인플루언서 등록
        </Link>
      </div>

      <IHDuplicateCandidatesPanel />
      <IHInfluencerListClient />
    </div>
  );
}
