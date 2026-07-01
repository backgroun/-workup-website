import type { Metadata } from "next";
import StoreLocator from "@/components/StoreLocator";
import { getPublicStores } from "@/lib/publicStores";

export const metadata: Metadata = {
  title: "매장 찾기 — WORKUP",
  description: "전국 워크업 매장. 내 주변 매장을 찾아 직접 방문해 보세요.",
};

export default async function StorePage() {
  const stores = await getPublicStores();
  return (
    <main>
      <StoreLocator stores={stores} />
    </main>
  );
}
