import Link from "next/link";
import IHSponsorListClient from "@/components/ih/sponsors/IHSponsorListClient";
import IHSponsorExportButton from "@/components/ih/sponsors/IHSponsorExportButton";

export default function IHSponsorsPage() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <nav className="text-[13px] text-slate-500 mb-1.5">Influencer Hub · 제품 협찬</nav>
          <h1 className="text-[19px] font-bold text-slate-900 tracking-tight">제품 협찬</h1>
          <p className="mt-1 text-[14px] text-slate-600">협찬 현황 · 등록 · 진행 상태 관리</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <IHSponsorExportButton />
          <Link
            href="/admin/influencer-hub/sponsors/import"
            className="rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-[14px] font-semibold px-4 py-2 transition-colors"
          >
            Excel 업로드
          </Link>
          <Link
            href="/admin/influencer-hub/sponsors/new"
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 shadow-sm transition-colors"
          >
            + 협찬 등록
          </Link>
        </div>
      </div>

      <IHSponsorListClient />
    </div>
  );
}
