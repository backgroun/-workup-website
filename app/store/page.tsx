import type { Metadata } from "next";
import StoreLocator from "@/components/StoreLocator";

export const metadata: Metadata = {
  title: "매장 찾기 — WORKUP",
  description: "전국 154개 워크업 매장. 내 주변 20km 이내 매장을 찾아보세요.",
};

export default function StorePage() {
  return (
    <main>
      <StoreLocator />
    </main>
  );
}
