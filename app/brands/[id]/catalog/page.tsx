import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { BRANDS } from "@/lib/brands-data";
import { loadBrandCatalog } from "@/lib/brandCatalog-server";
import BrandCatalogView from "@/components/BrandCatalogView";
import CatalogBodyClass from "@/components/CatalogBodyClass";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const staticBrand = BRANDS.find((b) => b.id === id);
  if (!staticBrand) return {};
  const data = await loadBrandCatalog(id);
  const name = data?.brand.name ?? staticBrand.name;
  const desc = data?.meta.intro || data?.brand.description || `${name} 제품 카탈로그`;
  return {
    title: `${name} 카탈로그 | WORKUP`,
    description: desc,
    openGraph: {
      title: `${name} 카탈로그 | WORKUP`,
      description: desc,
      images: data?.meta.cover_url ? [data.meta.cover_url] : undefined,
    },
  };
}

export default async function BrandAssembledCatalogPage({ params }: Props) {
  noStore();
  const { id } = await params;
  const data = await loadBrandCatalog(id);
  if (!data || data.items.length === 0) notFound();

  const brandName = data.brand.name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "HOME", item: "/" },
          { "@type": "ListItem", position: 2, name: "BRAND", item: "/brands" },
          { "@type": "ListItem", position: 3, name: `${brandName} 카탈로그` },
        ],
      },
      { "@type": "Brand", name: brandName, description: data.brand.description ?? "" },
    ],
  };

  return (
    <main>
      <CatalogBodyClass />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BrandCatalogView data={data} />
    </main>
  );
}
