import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";

export const metadata: Metadata = {
  title: "WORKUP SITE — 현장을 위한 워크웨어",
  description: "혹독한 환경에서 살아남도록 설계된 순수 기능 워크웨어.",
};

export default function SitePage() {
  return (
    <main>
      <div className="bg-[#303236] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">WORKUP SITE</p>
          <h1 className="text-4xl font-bold text-white mb-4">현장을 위한 라인</h1>
          <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
            혹독한 환경에서 살아남도록 설계된 순수 기능 워크웨어.<br />
            현장에서 먼저 검증하고, 통과한 것만 올립니다.
          </p>
        </div>
      </div>
      <ProductGrid
        title="WORKUP SITE"
        subtitle="현장에서 검증된 순수 기능 워크웨어. 혹독한 환경에서 살아남도록 설계했습니다."
        filter="SITE"
      />
    </main>
  );
}
