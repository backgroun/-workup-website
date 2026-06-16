import type { Metadata } from "next";
import { WholesaleForm } from "@/components/PartnershipForms";
import PartnershipLayout from "@/components/PartnershipLayout";
import { DEFAULT_PARTNERSHIP, type PartnershipConfig } from "@/data/partnership";
import { getSiteSection } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "브랜드 입점·제휴 문의 | WORKUP",
  description: "내 브랜드 제품을 WORKUP 매장에 납품하고 싶은 분을 위한 입점·제휴 문의 안내.",
};

export default async function WholesalePage() {
  const config = await getSiteSection<PartnershipConfig>("partnership_page");
  const info = config?.wholesale ?? DEFAULT_PARTNERSHIP.wholesale;

  return (
    <PartnershipLayout info={info} panelBg="#2d4f72">
      <WholesaleForm />
    </PartnershipLayout>
  );
}
