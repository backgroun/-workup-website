import IHPagePlaceholder from "@/components/ih/IHPagePlaceholder";

export default function IHBranchMarketingPage() {
  return (
    <IHPagePlaceholder
      breadcrumbLabel="지점 마케팅"
      title="지점 마케팅"
      description="지점별 집행 현황 · 지점 상세 · 성과(CPV/CPE)"
      actionLabel="+ 마케팅 등록"
      emptyMessage="등록된 지점 마케팅 내역이 없습니다"
      emptyHint="마케팅을 등록하면 이곳에 목록이 표시됩니다"
    />
  );
}
