import { notFound } from "next/navigation";
import { getInfluencerDetail, toMobileSummary } from "@/lib/ih/influencers";
import IHInfluencerDetailClient from "@/components/ih/influencers/IHInfluencerDetailClient";

export default async function IHInfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  // PC 상세와 Mobile Viewer가 같은 조회 결과를 쓰도록, detail 하나만 조회하고 mobileSummary는 그 결과를 가공만 한다.
  const detail = await getInfluencerDetail(id);
  if (!detail) notFound();
  const mobileSummary = toMobileSummary(detail);

  return <IHInfluencerDetailClient detail={detail} mobileSummary={mobileSummary} />;
}
