import Link from "next/link";
import { ikSrc } from "@/lib/imageSrc";
import { buildCatalogToc } from "@/data/brandCatalog";
import type { LoadedBrandCatalog } from "@/lib/brandCatalog-server";
import BrandCatalogItem from "./BrandCatalogItem";
import BrandCatalogTocBar from "./BrandCatalogTocBar";

export default function BrandCatalogView({ data }: { data: LoadedBrandCatalog }) {
  const { brand, meta, items } = data;
  const accent = brand.accent_color || "#E5541B";
  const brandName = brand.name;
  const title = meta.headline || brandName;
  const toc = buildCatalogToc(items);

  return (
    <div className="bg-white">
      {/* 커버 */}
      <section className="relative overflow-hidden" style={{ minHeight: "72vh", backgroundColor: meta.cover_url ? undefined : accent }}>
        {meta.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ikSrc(meta.cover_url, 1800)} alt={`${brandName} 카탈로그 커버`}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative max-w-screen-lg mx-auto px-6 flex flex-col justify-end" style={{ minHeight: "72vh", paddingBottom: "3rem" }}>
          {meta.season ? <p className="text-[11px] tracking-[0.3em] uppercase text-white/80 mb-3">{meta.season}</p> : null}
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt={brandName} className="max-h-16 md:max-h-20 max-w-xs object-contain mb-3" />
          ) : (
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">{title}</h1>
          )}
          {meta.intro ? <p className="mt-4 max-w-xl text-sm md:text-base text-white/85 leading-relaxed whitespace-pre-line">{meta.intro}</p> : null}
        </div>
      </section>

      {/* 목차 바 (스크롤 시 상단 고정) */}
      <BrandCatalogTocBar groups={toc} accent={accent} />

      {/* 제품 섹션 */}
      <div className="max-w-screen-lg mx-auto px-4 md:px-6">
        {toc.map((group) => {
          const groupItems = items.filter((it) => (it.category.trim() || "제품") === group.category);
          return (
            <section key={group.category} className="pt-10">
              <h3 className="text-[11px] tracking-[0.3em] uppercase font-bold" style={{ color: accent }}>
                {group.category}
              </h3>
              {groupItems.map((it) => (
                <BrandCatalogItem key={it.id} item={it} accent={accent} />
              ))}
            </section>
          );
        })}
      </div>

      {/* 공용 기술서 */}
      {meta.tech_images.length > 0 ? (
        <div className="max-w-screen-lg mx-auto px-4 md:px-6 py-10 space-y-4">
          <h3 className="text-[11px] tracking-[0.3em] uppercase font-bold text-gray-400">기술 자료</h3>
          {meta.tech_images.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ikSrc(t, 1400)} alt={`${brandName} 기술서 ${i + 1}`}
              className="w-full rounded border border-gray-100" loading="lazy" />
          ))}
        </div>
      ) : null}

      {/* 하단 CTA — 매장 방문/문의 유도 */}
      <section className="max-w-screen-lg mx-auto px-4 md:px-6 pb-20 pt-6">
        <div className="border border-gray-100 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[9px] tracking-[0.3em] font-bold uppercase mb-1 text-gray-400">STORE</p>
            <h3 className="text-xl font-black text-gray-900">매장에서 직접 확인해보세요</h3>
            <p className="text-gray-500 text-sm mt-1">가까운 WORKUP 매장에서 {brandName} 제품을 만나보실 수 있습니다.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href="/store" className="flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white min-h-[44px]"
              style={{ backgroundColor: accent }}>
              가까운 매장 찾기
            </Link>
            <Link href="/support" className="flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-400 min-h-[44px]">
              제품 문의하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
