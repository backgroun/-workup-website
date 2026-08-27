import { notFound } from "next/navigation";
import { getBrandedPplDetail, getBrandedPplPriceHistory } from "@/lib/ih/collabs";
import IHBrandedPplDetailClient from "@/components/ih/branded-ppl/IHBrandedPplDetailClient";

export default async function IHBrandedPplDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const detail = await getBrandedPplDetail(id);
  if (!detail) notFound();

  const priceHistory = await getBrandedPplPriceHistory(id);

  return <IHBrandedPplDetailClient detail={detail} priceHistory={priceHistory} />;
}
