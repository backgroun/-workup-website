import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WORKUP PRO — 프리미엄 라인",
  description: "소재와 설계를 타협하지 않은 워크업의 플래그십 라인.",
};

export default function ProPage() {
  return (
    <main>
      <div className="bg-[#E5541B] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-orange-100 uppercase mb-3">WORKUP PRO</p>
          <h1 className="text-4xl font-bold text-white mb-4">프리미엄 라인</h1>
          <p className="text-orange-100 text-sm leading-relaxed max-w-xl">
            소재와 설계를 타협하지 않은 워크업의 플래그십.<br />
            최상의 기능을 원할 때.
          </p>
        </div>
      </div>
      <section className="py-32 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs tracking-widest text-[#E5541B] uppercase mb-6">COMING SOON</p>
          <h2 className="text-3xl font-bold text-[#303236] mb-6">
            WORKUP PRO를 준비하고 있습니다.
          </h2>
          <p className="text-gray-500 text-sm leading-loose max-w-md mx-auto mb-10">
            타협 없는 소재와 설계.<br />
            워크업이 가장 자신 있는 제품들로 구성됩니다.<br />
            곧 만나보실 수 있습니다.
          </p>
          <Link
            href="/site"
            className="inline-block bg-[#303236] text-white text-sm tracking-widest px-8 py-3 hover:bg-[#243d5e] transition-colors"
          >
            WORKUP SITE 보러가기
          </Link>
        </div>
      </section>
    </main>
  );
}
