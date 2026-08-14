import IHPageHeader from "@/components/ih/IHPageHeader";
import IHInfluencerForm from "@/components/ih/influencers/IHInfluencerForm";

export default function IHInfluencerNewPage() {
  return (
    <div>
      <IHPageHeader breadcrumb={["Influencer Hub", "인플루언서", "등록"]} title="인플루언서 등록" description="닉네임만 있으면 등록할 수 있습니다. 나머지는 나중에 채워도 됩니다." />
      <IHInfluencerForm mode="create" />
    </div>
  );
}
