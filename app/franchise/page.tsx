import type { Metadata } from "next";
import FranchiseGuide from "@/components/FranchiseGuide";

export const metadata: Metadata = {
  title: "워크업 창업안내 — 국내 최초 워크웨어 아울렛",
  description:
    "워크업(WORKUP) 가맹·창업 안내. 국내 최초 워크웨어 아울렛, 연매출 15억+, 마진율 31.5~35%, 상권 보호 5km, 초기비용 부담 감소. 계약 가맹수 130호점 돌파.",
};

export default function FranchiseGuidePage() {
  return <FranchiseGuide />;
}
