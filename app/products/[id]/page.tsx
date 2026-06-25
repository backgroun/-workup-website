import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products as staticProducts, getProductById, type Product } from "@/data/products";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductImageGallery from "@/components/ProductImageGallery";
import MobileProductNav from "@/components/MobileProductNav";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 0;

export async function generateStaticParams() {
  return staticProducts.map((p) => ({ id: p.id }));
}

async function fetchProduct(id: string) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    if (data) return mapFromDb(data);
  } catch {}
  return getProductById(id);
}

async function fetchRelatedProducts(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("products").select("*").in("id", ids);
    if (data?.length) return data.map(mapFromDb);
  } catch {}
  return ids.map((id) => getProductById(id)).filter(Boolean) as Product[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) return { title: "제품을 찾을 수 없습니다 | WORKUP" };
  return {
    title: `${product.name} — WORKUP ${product.line}`,
    description: product.tagline,
  };
}

const SIZE_GUIDE = [
  { size: "S",   chest: "88-92",   waist: "72-76", hip: "90-94" },
  { size: "M",   chest: "92-96",   waist: "76-80", hip: "94-98" },
  { size: "L",   chest: "96-100",  waist: "80-84", hip: "98-102" },
  { size: "XL",  chest: "100-104", waist: "84-88", hip: "102-106" },
  { size: "2XL", chest: "104-108", waist: "88-92", hip: "106-110" },
];

const WASH_ICON_MAP: Record<string, string> = {
  "cold": "🌡️",
  "no-dry": "🚫",
  "no-bleach": "🚫",
  "low-iron": "♨️",
  "hand-wash": "🤲",
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const relatedProducts = await fetchRelatedProducts(product.relatedIds ?? []);
  const isNewLayout = !!(product.keyFeatures && product.keyFeatures.length > 0);

  return (
    <main className={`bg-white min-h-screen${isNewLayout ? " pb-20 md:pb-0" : ""}`}>

      {/* 모바일 네비 */}
      <MobileProductNav />

      {/* 데스크탑 브레드크럼 */}
      <div className="hidden md:block border-b border-gray-100">
        <nav className="max-w-screen-2xl mx-auto px-8 py-3 flex items-center gap-2 text-[11px] text-gray-400 tracking-wide overflow-hidden">
          <Link href="/products" className="hover:text-gray-600 transition-colors whitespace-nowrap">전체 제품</Link>
          {product.category && (
            <>
              <span className="flex-shrink-0">/</span>
              <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-gray-600 transition-colors whitespace-nowrap">
                {product.category}
              </Link>
            </>
          )}
          {product.subCategory && (
            <>
              <span className="flex-shrink-0">/</span>
              <Link href={`/products?category=${encodeURIComponent(product.category ?? "")}&sub=${encodeURIComponent(product.subCategory)}`} className="hover:text-gray-600 transition-colors whitespace-nowrap">
                {product.subCategory}
              </Link>
            </>
          )}
          <span className="flex-shrink-0">/</span>
          <span className="text-gray-500 truncate">{product.name}</span>
        </nav>
      </div>

      {/* 갤러리 + 정보 패널 */}
      <div className="md:flex md:items-start max-w-screen-2xl mx-auto">
        <div className="w-full md:w-[58%] lg:w-[62%] md:sticky md:top-0 md:h-screen">
          <ProductImageGallery product={product} />
        </div>
        <div className="w-full md:w-[42%] lg:w-[38%]">
          <ProductDetailClient product={product} relatedProducts={relatedProducts} isNewLayout={isNewLayout} />
        </div>
      </div>

      {/* === 신규 레이아웃 10섹션 === */}
      {isNewLayout ? (
        <>
          {/* S2: 이런 분께 추천합니다 */}
          {product.recommendedFor && product.recommendedFor.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20 bg-[#fafafa]">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">RECOMMENDED FOR</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">이런 분께 추천합니다</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  {product.recommendedFor.map((item) => (
                    <li key={item} className="flex items-start gap-3 bg-white border border-gray-100 px-5 py-4">
                      <span className="text-[#ff550c] font-bold text-base flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-sm text-[#1A2B4A] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* S3: 핵심 기능 */}
          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">KEY FEATURES</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">핵심 기능</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                  {product.keyFeatures.map((feat, i) => (
                    <div key={feat.title} className="flex gap-5 items-start">
                      <div className="w-8 h-8 bg-[#1A2B4A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1A2B4A] mb-1">{feat.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* S4: 디테일 포인트 */}
          {product.detailPoints && product.detailPoints.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20 bg-gray-50">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">DETAIL</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">디테일 포인트</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {product.detailPoints.map((label) => (
                    <div key={label} className="aspect-square bg-[#1A2B4A] flex items-end p-4">
                      <span className="text-xs text-white/80 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* S5: 라이프스타일 착용 씬 */}
          {product.lifestyleScenes && product.lifestyleScenes.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">LIFESTYLE</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">이렇게 활용하세요</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.lifestyleScenes.map((scene, i) => (
                    <div key={scene.tag} className={`${i % 2 === 0 ? "bg-[#1A2B4A]" : "bg-gray-100"} p-8 md:p-12 flex flex-col justify-end min-h-[240px]`}>
                      <p className="text-[10px] tracking-[0.3em] text-[#ff550c] uppercase mb-2">{scene.tag}</p>
                      <p className={`text-lg font-bold mb-1 ${i % 2 === 0 ? "text-white" : "text-[#1A2B4A]"}`}>{scene.title}</p>
                      <p className={`text-sm leading-relaxed ${i % 2 === 0 ? "text-gray-300" : "text-gray-500"}`}>{scene.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* S6: 사이즈 가이드 (신체 치수 기반) */}
          <section className="border-t border-gray-100 py-16 md:py-20 bg-[#fafafa]">
            <div className="max-w-screen-xl mx-auto px-6 md:px-12">
              <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">SIZE GUIDE</p>
              <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-2">사이즈 가이드</h2>
              {product.fitNote && (
                <p className="text-xs text-gray-400 mb-6">{product.fitNote}</p>
              )}
              {product.sizePrices && product.sizePrices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] max-w-xl text-sm">
                    <thead>
                      <tr className="bg-[#1A2B4A] text-white">
                        {["사이즈", "적용 체중", "판매가"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizePrices.map((row, i) => (
                        <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-5 py-3 font-bold text-[#1A2B4A] text-xs">{row.size}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{row.weight ?? "-"}</td>
                          <td className="px-5 py-3 text-[#ff550c] font-semibold text-xs">{row.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : product.sizeRecs && product.sizeRecs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] max-w-xl text-sm">
                    <thead>
                      <tr className="bg-[#1A2B4A] text-white">
                        {["사이즈", "키 (cm)", "몸무게 (kg)"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizeRecs.map((row, i) => (
                        <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-5 py-3 font-bold text-[#1A2B4A] text-xs">{row.size}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{row.height}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{row.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] max-w-lg text-sm">
                    <thead>
                      <tr className="bg-[#1A2B4A] text-white">
                        {["사이즈", "가슴둘레", "허리둘레", "엉덩이둘레"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_GUIDE.map((row, i) => (
                        <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 font-bold text-[#1A2B4A] text-xs">{row.size}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{row.chest}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{row.waist}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{row.hip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">* 사이즈가 고민된다면 매장에서 직접 입어보세요.</p>
            </div>
          </section>

          {/* S7: 소재 & 스펙 */}
          {product.materialSpecs && product.materialSpecs.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">MATERIAL & SPECS</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">소재 및 스펙</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 max-w-2xl">
                  {product.materialSpecs.map((spec, i) => (
                    <div key={spec.label} className={`flex gap-6 py-4 border-b border-gray-100 ${i % 2 === 0 ? "sm:pr-12" : ""}`}>
                      <span className="text-[12px] text-gray-400 w-16 flex-shrink-0">{spec.label}</span>
                      <span className="text-[13px] text-[#1A2B4A] font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* S8: 세탁 방법 */}
          {product.washCare && product.washCare.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20 bg-[#fafafa]">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">CARE</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">세탁 및 관리</h2>
                <div className="flex flex-wrap gap-6 max-w-2xl">
                  {product.washCare.map((care) => (
                    <div key={care.icon} className="flex flex-col items-center gap-2 w-20 text-center">
                      <div className="w-14 h-14 border-2 border-[#1A2B4A] flex items-center justify-center text-2xl">
                        {WASH_ICON_MAP[care.icon] ?? "○"}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{care.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* S9: 실제 리뷰 */}
          {product.productReviews && product.productReviews.length > 0 && (
            <section className="border-t border-gray-100 py-16 md:py-20">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-3">REVIEWS</p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-8">실제 사용 후기</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {product.productReviews.map((review, i) => (
                    <div key={i} className="border border-gray-100 p-6 bg-white">
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <span key={si} className={`text-sm ${si < review.stars ? "text-[#ff550c]" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#1A2B4A]">{review.job}</p>
                        {review.period && <p className="text-[10px] text-gray-400">{review.period}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* S10: 최종 CTA — 매장 방문 유도 */}
          <section className="bg-[#1A2B4A] py-16 md:py-24">
            <div className="max-w-screen-xl mx-auto px-6 md:px-12 text-center">
              <p className="text-[11px] tracking-[0.3em] text-[#ff550c] uppercase mb-5">VISIT US</p>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-snug">
                직접 입어봐야<br className="sm:hidden" /> 알 수 있습니다
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-10">
                사진으로는 느낄 수 없는 착용감, 소재감, 핏을<br />
                가까운 매장에서 직접 확인하세요.
              </p>
              <Link href="/store"
                className="inline-block bg-[#ff550c] text-white font-bold px-12 py-4 text-sm tracking-widest hover:bg-[#e04a0a] transition-colors">
                가까운 매장 찾기
              </Link>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* 착용자 인터뷰 — 구 레이아웃 */}
          {product.wearerQuote && (
            <section className="border-t border-gray-100 py-16 md:py-24">
              <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-8">실제 착용자 이야기</p>
                <div className="max-w-2xl">
                  <blockquote className="text-2xl md:text-4xl font-bold text-[#1A2B4A] leading-snug mb-8">
                    &ldquo;{product.wearerQuote.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1A2B4A] flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                      {product.wearerQuote.job[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B4A]">{product.wearerQuote.job}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.wearerQuote.years}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Link href="/people" className="text-sm text-[#1A2B4A] border-b border-[#1A2B4A] hover:text-[#ff550c] hover:border-[#ff550c] transition-colors pb-0.5">
                    더 많은 착용자 이야기 →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* 핵심 기능 — 구 레이아웃 */}
          <section className="border-t border-gray-100 py-16 md:py-20 bg-[#fafafa]">
            <div className="max-w-screen-xl mx-auto px-6 md:px-12">
              <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-8">제품 특징</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {product.features.map((f) => (
                  <div key={f} className="flex items-start gap-4 py-4 border-b border-gray-200">
                    <span className="w-5 h-5 bg-[#ff550c] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-sm text-[#1A2B4A] leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 사이즈 가이드 — 구 레이아웃 */}
          <section className="border-t border-gray-100 py-16 md:py-20">
            <div className="max-w-screen-xl mx-auto px-6 md:px-12">
              <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-6">사이즈 가이드</p>
              <p className="text-xs text-gray-400 mb-4">단위: cm</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] max-w-lg text-sm">
                  <thead>
                    <tr className="bg-[#1A2B4A] text-white">
                      {["사이즈", "가슴둘레", "허리둘레", "엉덩이둘레"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((row, i) => (
                      <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-bold text-[#1A2B4A] text-xs">{row.size}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.chest}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.waist}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-4">* 사이즈가 고민된다면 매장에서 직접 입어보세요.</p>
            </div>
          </section>
        </>
      )}

      {/* 모바일 하단 고정 CTA바 — 신규 레이아웃 / 매장 찾기만 */}
      {isNewLayout && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A2B4A]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <Link href="/store"
            className="w-full bg-[#1A2B4A] text-white text-sm font-bold py-4 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            매장 찾기
          </Link>
        </div>
      )}

    </main>
  );
}
