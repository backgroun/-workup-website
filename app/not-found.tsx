import type { Metadata } from "next";
import Link from "next/link";
import { getFooterConfig } from "@/lib/footer-server";

// 매장 안내 페이지(StoreLocator.tsx)와 동일한 카카오 채널 — 사이트 전역 상담 창구.
const KAKAO_CHANNEL = "https://pf.kakao.com/_workup";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  description: "요청하신 페이지가 삭제되었거나 주소가 변경되었습니다. 가까운 워크업 매장에서 제품을 직접 확인해보세요.",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const footer = await getFooterConfig();
  const telHref = `tel:${footer.cs_phone.replace(/[^0-9+]/g, "")}`;

  return (
    <main className="min-h-[70vh] flex items-center">
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28 text-center">
        <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-4">Page Not Found</p>

        <p className="text-[88px] md:text-[120px] font-black leading-none text-[#1A2B4A]">404</p>

        <h1 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mt-4 mb-3">
          요청하신 페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          페이지가 삭제되었거나 주소가 변경되었습니다.
          <br />
          대신 가까운 매장에서 제품을 직접 만나보세요.
        </p>

        {/* 오프라인 방문 유도 핵심 CTA */}
        <div className="mt-8">
          <Link
            href="/store"
            className="store-cta inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            가까운 매장 찾기
          </Link>
        </div>

        {/* 보조 CTA — 전화·카카오 상담 */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 border-2 border-[#1A2B4A] text-[#1A2B4A] text-sm font-semibold px-5 py-2.5 hover:bg-[#1A2B4A] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            전화 문의
          </a>
          <a
            href={KAKAO_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#FEE500] text-[#3C1E1E] text-sm font-semibold px-5 py-2.5 hover:bg-[#f5dc00] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.603 1.543 4.9 3.9 6.32l-.975 3.573c-.087.318.268.572.55.39L9.662 18.5A11.01 11.01 0 0012 18.75c5.523 0 10-3.697 10-8.25S17.523 3 12 3z" />
            </svg>
            카카오톡 상담
          </a>
        </div>

        {/* 이탈 방지 — 다른 경로 안내 */}
        <div className="mt-10 flex items-center justify-center gap-5 text-xs flex-wrap">
          <Link href="/" className="text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">홈으로</Link>
          <Link href="/products" className="text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">전체 상품 보기</Link>
          <Link href="/catalog" className="text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">카탈로그</Link>
        </div>
      </div>
    </main>
  );
}
