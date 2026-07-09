import type { Metadata } from "next";
import { FranchiseForm } from "@/components/PartnershipForms";
import PartnershipLayout from "@/components/PartnershipLayout";
import FranchiseGuideModal from "@/components/FranchiseGuideModal";
import { normalizePartnership, type PartnershipConfig } from "@/data/partnership";
import { getSiteSection } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteSection<PartnershipConfig>("partnership_page");
  const info = normalizePartnership(config).franchise;
  return { title: info.seo_title, description: info.seo_desc };
}

export default async function FranchisePage() {
  const config = await getSiteSection<PartnershipConfig>("partnership_page");
  const info = normalizePartnership(config).franchise;

  return (
    <PartnershipLayout info={info} boardType="franchise" guideButton={<FranchiseGuideModal label="워크업 창업안내 한눈에 보기" />}>
      <FranchiseForm config={info.form} />
    </PartnershipLayout>
  );
}
