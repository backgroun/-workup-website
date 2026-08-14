import IHPageHeader from "./IHPageHeader";
import IHEmptyState from "./IHEmptyState";

/** IH 스텁 페이지 공용 구성 — Header + Empty State. Phase 2에서는 실제 데이터/CRUD를 연결하지 않는다. */
export default function IHPagePlaceholder({
  breadcrumbLabel,
  title,
  description,
  actionLabel,
  emptyMessage,
  emptyHint,
}: {
  breadcrumbLabel: string;
  title: string;
  description: string;
  actionLabel?: string;
  emptyMessage: string;
  emptyHint?: string;
}) {
  return (
    <div>
      <IHPageHeader
        breadcrumb={["Influencer Hub", breadcrumbLabel]}
        title={title}
        description={description}
        actionLabel={actionLabel}
      />
      <IHEmptyState message={emptyMessage} hint={emptyHint} />
    </div>
  );
}
