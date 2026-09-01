import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { loadBrandCatalog } from "@/lib/brandCatalog-server";
import UnifiedCatalogViewer from "@/components/UnifiedCatalogViewer";
import CatalogBodyClass from "@/components/CatalogBodyClass";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await loadBrandCatalog(id);
  if (!data) return {};
  const name = data.brand.name;
  return {
    title: `${name} 카탈로그 | WORKUP`,
    description: `${name} 제품 카탈로그. WORKUP K-WORKER STORE.`,
  };
}

export default async function BrandCatalogPage({ params }: Props) {
  noStore();
  const { id } = await params;
  const data = await loadBrandCatalog(id);
  if (!data || data.pages.length === 0) notFound();

  const brandName = data.brand.name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "HOME", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "BRAND", item: absoluteUrl("/brands") },
        { "@type": "ListItem", position: 3, name: `${brandName} 카탈로그` },
      ] },
      { "@type": "Brand", name: brandName, description: data.brand.description ?? "" },
    ],
  };

  return (
    <main>
      <CatalogBodyClass />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <UnifiedCatalogViewer workupPages={data.pages} brands={[]} sourceLabel={brandName} />
    </main>
  );
}
