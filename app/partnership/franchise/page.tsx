import type { Metadata } from "next";
import { FranchiseForm } from "@/components/PartnershipForms";
import PartnershipLayout from "@/components/PartnershipLayout";
import FranchiseGuideModal from "@/components/FranchiseGuideModal";
import { normalizePartnership, type PartnershipConfig } from "@/data/partnership";
import { normalizeFranchiseGuide, type FranchiseGuideConfig } from "@/data/franchise-guide";
import { getSiteSection } from "@/lib/site-settings";
import { getActiveStoreCount } from "@/lib/publicStores";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteSection<PartnershipConfig>("partnership_page");
  const info = normalizePartnership(config).franchise;
  return { title: info.seo_title, description: info.seo_desc };
}

export default async function FranchisePage() {
  const [pConfig, gRaw, storeCount] = await Promise.all([
    getSiteSection<PartnershipConfig>("partnership_page"),
    getSiteSection<FranchiseGuideConfig>("franchise_guide"),
    getActiveStoreCount(),
  ]);
  const info = normalizePartnership(pConfig).franchise;
  const guide = normalizeFranchiseGuide(gRaw);

  return (
    <PartnershipLayout
      info={info}
      boardType="franchise"
      guideButton={
        <>
          <FranchiseGuideModal label="워크업 창업안내 한눈에 보기" config={guide} storeCount={storeCount} />
          <p className="px-8 py-3 text-xs text-gray-500 bg-[#F5F2ED] border-b border-gray-200">
            가맹 창업 문의하기 폼에 작성하시고, &apos;가맹 문의 접수하기&apos; 버튼을 누르시면 문의가 접수됩니다.
          </p>
        </>
      }
    >
      <FranchiseForm config={info.form} guideConfig={guide} storeCount={storeCount} />
    </PartnershipLayout>
  );
}
