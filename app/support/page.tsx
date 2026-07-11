import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSection } from "@/lib/site-settings";
import { getFooterConfig } from "@/lib/footer-server";
import { DEFAULT_SUPPORT, normalizeSupport, type SupportConfig } from "@/lib/site-content";
import SupportForm from "@/components/SupportForm";

export const metadata: Metadata = {
  title: "고객센터 · 1:1 문의 — WORKUP",
  description: "워크업 고객센터. 제품·사이즈, 매장 방문, 교환/반품 등 무엇이든 1:1로 문의하세요.",
};

export default async function SupportPage() {
  const [supRaw, footer] = await Promise.all([
    getSiteSection<SupportConfig>("support_page"),
    getFooterConfig(),
  ]);
  const sup = normalizeSupport(supRaw);
  const telHref = `tel:${footer.cs_phone.replace(/[^0-9+]/g, "")}`;

  return (
    <main>
      {/* 히어로 */}
      <section className="bg-[#FAFAF8] pt-16 md:pt-20 pb-2">
        <div className="max-w-6xl mx-auto px-6">
          {sup.hero_eyebrow && (
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">{sup.hero_eyebrow}</p>
          )}
          {sup.hero_title && (
            <h1 className="text-[32px] md:text-[42px] font-bold text-[#303236] leading-tight mb-4">{sup.hero_title}</h1>
          )}
          {sup.hero_desc && (
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-xl whitespace-pre-line">{sup.hero_desc}</p>
          )}
        </div>
      </section>

      <div className="bg-[#FAFAF8] pb-12 md:pb-16 pt-8 md:pt-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:items-stretch">

            {/* 좌: 안내 이미지 + 고객센터 정보 */}
            <div className="flex flex-col border border-gray-200 bg-white overflow-hidden">
              {sup.guide_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sup.guide_image_url} alt="고객센터 안내" className="w-full object-cover" />
              ) : (
                <div className="bg-[#303236] px-8 py-12">
                  <h2 className="text-2xl font-bold text-white mb-3 whitespace-pre-line">{sup.intro_title}</h2>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{sup.intro_desc}</p>
                </div>
              )}

              <div className="px-8 py-8 flex-1">
                {sup.guide_image_url && (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">{sup.intro_desc}</p>
                )}

                <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">고객센터</p>
                <a href={telHref} className="text-2xl font-bold text-[#303236] hover:text-[#ff550c] transition-colors">
                  {footer.cs_phone}
                </a>
                <div className="text-sm text-gray-500 mt-2 leading-relaxed">
                  <p>{footer.cs_hours_weekday}</p>
                  <p>{footer.cs_hours_weekend}</p>
                </div>

                {/* 오프라인 전환 CTA */}
                <div className="mt-7 flex flex-wrap gap-2.5">
                  <a href={telHref}
                    className="inline-flex items-center gap-1.5 bg-[#ff550c] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#d6480a] transition-colors">
                    전화 문의
                  </a>
                  <Link href="/store"
                    className="inline-flex items-center gap-1.5 border border-[#303236] text-[#303236] text-sm font-semibold px-5 py-2.5 hover:bg-[#303236] hover:text-white transition-colors">
                    매장 찾기
                  </Link>
                </div>
              </div>
            </div>

            {/* 우: 1:1 문의 폼 */}
            <div className="flex flex-col border border-gray-200 bg-white overflow-hidden">
              <div className="px-8 py-8">
                <h3 className="text-base font-bold text-[#303236] mb-1">1:1 문의하기</h3>
                <p className="text-xs text-gray-400 mb-6">문의 구분을 선택하고 내용을 남겨 주세요.</p>
                <SupportForm />
              </div>
            </div>

          </div>

          {/* 다른 문의 경로 */}
          <div className="flex items-center justify-center gap-5 text-xs flex-wrap mt-8">
            <Link href="/partnership/franchise" className="text-[#303236] underline hover:text-[#ff550c] transition-colors">가맹·창업 문의</Link>
            <Link href="/partnership/wholesale" className="text-[#303236] underline hover:text-[#ff550c] transition-colors">입점·제휴 문의</Link>
            <Link href="/store" className="text-[#303236] underline hover:text-[#ff550c] transition-colors">매장 안내</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
