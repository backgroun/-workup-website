import { notFound } from "next/navigation";
import IHPageHeader from "@/components/ih/IHPageHeader";
import IHInfluencerForm from "@/components/ih/influencers/IHInfluencerForm";
import { getInfluencerById } from "@/lib/ih/influencers";

export default async function IHInfluencerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const influencer = await getInfluencerById(id);
  if (!influencer) notFound();

  return (
    <div>
      <IHPageHeader breadcrumb={["Influencer Hub", "인플루언서", influencer.nickname]} title={`${influencer.nickname} 수정`} />
      <IHInfluencerForm mode="edit" influencerId={id} initial={influencer} />
    </div>
  );
}
