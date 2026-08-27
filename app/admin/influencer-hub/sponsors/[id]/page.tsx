import { notFound } from "next/navigation";
import { getSponsorDetail } from "@/lib/ih/collabs";
import { getInfluencerDetail, toMobileSummary } from "@/lib/ih/influencers";
import IHSponsorDetailClient from "@/components/ih/sponsors/IHSponsorDetailClient";

export default async function IHSponsorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();

  // Mobile Viewer는 PC와 동일한 influencer_id 기준 조회 결과를 그대로 재사용한다(별도 mock 없음).
  const influencerDetail = await getInfluencerDetail(sponsor.influencerId);
  if (!influencerDetail) notFound();
  const mobileSummary = toMobileSummary(influencerDetail);

  return <IHSponsorDetailClient sponsor={sponsor} mobileSummary={mobileSummary} />;
}
