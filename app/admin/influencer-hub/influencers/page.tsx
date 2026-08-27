import Link from "next/link";
import IHInfluencerListClient from "@/components/ih/influencers/IHInfluencerListClient";
import IHDuplicateCandidatesPanel from "@/components/ih/influencers/IHDuplicateCandidatesPanel";
import IHInfluencerExportButton from "@/components/ih/influencers/IHInfluencerExportButton";

export default function IHInfluencersPage() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <nav className="text-[13px] text-slate-500 mb-1.5">Influencer Hub · 인플루언서</nav>
          <h1 className="text-[19px] font-bold text-slate-900 tracking-tight">인플루언서</h1>
          <p className="mt-1 text-[14px] text-slate-600">전체 인플루언서 DB · 검색 · 필터 · 상세</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <IHInfluencerExportButton />
          <Link
            href="/admin/influencer-hub/influencers/import"
            className="rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-[14px] font-semibold px-4 py-2 transition-colors"
          >
            Excel 업로드
          </Link>
          <Link
            href="/admin/influencer-hub/influencers/new"
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 shadow-sm transition-colors"
          >
            + 인플루언서 등록
          </Link>
        </div>
      </div>

      <IHDuplicateCandidatesPanel />
      <IHInfluencerListClient />
    </div>
  );
}
