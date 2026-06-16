import type { Metadata } from "next";
import { FranchiseForm } from "@/components/PartnershipForms";
import PartnershipLayout from "@/components/PartnershipLayout";
import { DEFAULT_PARTNERSHIP, type PartnershipConfig } from "@/data/partnership";
import { getSiteSection } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "가맹·창업 문의 | WORKUP",
  description: "WORKUP 브랜드로 독립 매장을 창업하고 싶으신 분을 위한 가맹·창업 문의 안내.",
};

export default async function FranchisePage() {
  const config = await getSiteSection<PartnershipConfig>("partnership_page");
  const info = config?.franchise ?? DEFAULT_PARTNERSHIP.franchise;

  return (
    <PartnershipLayout info={info} panelBg="#1A2B4A">
      <FranchiseForm />
    </PartnershipLayout>
  );
}
