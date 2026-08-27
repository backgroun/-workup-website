import Link from "next/link";
import IHBrandedPplForm from "@/components/ih/branded-ppl/IHBrandedPplForm";

export default function IHBrandedPplNewPage() {
  return (
    <div>
      <Link href="/admin/influencer-hub/branded-ppl" className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        브랜디드/PPL
      </Link>
      <h1 className="text-[19px] font-bold text-slate-900 tracking-tight mb-4">PPL 등록</h1>
      <IHBrandedPplForm mode="create" />
    </div>
  );
}
