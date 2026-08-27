import { notFound } from "next/navigation";
import { getBranchMarketingDetail } from "@/lib/ih/collabs";
import { getInfluencerDetail, toMobileSummary } from "@/lib/ih/influencers";
import IHBranchMarketingDetailClient from "@/components/ih/branch-marketing/IHBranchMarketingDetailClient";
import IHMobileSelectSync from "@/components/ih/influencers/IHMobileSelectSync";

export default async function IHBranchMarketingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const detail = await getBranchMarketingDetail(id);
  if (!detail) notFound();

  // 인플루언서가 매칭된 건이면 Mobile Viewer도 PC와 동일한 influencer_id 기준으로 동기화한다(별도 mock 없음).
  const influencerDetail = detail.influencerId ? await getInfluencerDetail(detail.influencerId) : null;
  const mobileSummary = influencerDetail ? toMobileSummary(influencerDetail) : null;

  return (
    <>
      {mobileSummary && <IHMobileSelectSync summary={mobileSummary} />}
      <IHBranchMarketingDetailClient detail={detail} />
    </>
  );
}
