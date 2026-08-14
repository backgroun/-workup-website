/** IH Workspace 공통 Empty State — 최종 디자인 기준(개발 단계 메시지 아님). */
export default function IHEmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto w-11 h-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="mt-4 text-[14px] font-medium text-slate-600">{message}</p>
      {hint && <p className="mt-1.5 text-[12.5px] text-slate-400">{hint}</p>}
    </div>
  );
}
