import type { Metadata } from "next";
import { Suspense } from "react";
import StoreLocator from "@/components/StoreLocator";
import { getPublicStores } from "@/lib/publicStores";
import { getSiteSection } from "@/lib/site-settings";
import { normalizeStorePage, type StorePageConfig } from "@/lib/store-page";

export const metadata: Metadata = {
  title: "매장 찾기 — WORKUP",
  description: "전국 워크업 매장. 내 주변 매장을 찾아 직접 방문해 보세요.",
};

export default async function StorePage() {
  const [stores, headerCfg] = await Promise.all([
    getPublicStores(),
    getSiteSection<Partial<StorePageConfig>>("store_page"),
  ]);
  const header = normalizeStorePage(headerCfg);
  return (
    <main>
      <Suspense>
        <StoreLocator stores={stores} header={header} />
      </Suspense>
    </main>
  );
}
