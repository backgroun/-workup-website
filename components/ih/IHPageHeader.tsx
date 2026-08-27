/**
 * IH Workspace 공통 헤더 — Breadcrumb / 제목+설명 / 우측 Action.
 * Phase 2에서는 action 버튼을 실제 기능과 연결하지 않는다(시각적 자리만 확보).
 */
export default function IHPageHeader({
  breadcrumb,
  title,
  description,
  actionLabel,
}: {
  breadcrumb: string[];
  title: string;
  description?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <nav className="text-[13px] text-slate-500 mb-1.5">{breadcrumb.join(" · ")}</nav>
        <h1 className="text-[19px] font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-slate-600">{description}</p>}
      </div>

      {actionLabel && (
        <button
          type="button"
          title="다음 Phase에서 연결됩니다"
          className="flex-shrink-0 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 shadow-sm transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
