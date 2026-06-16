import Link from "next/link";

export default function HomeSetupBanner() {
  return (
    <section className="bg-[#2d4f72]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">Coming Soon</p>
            <h2 className="text-3xl font-bold text-white mb-3">
              셋업 라인
              <span className="text-[#ff550c] ml-3 text-2xl">출시 예정</span>
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-lg">
              상·하의 매칭 세트로 완성하는 워크업 셋업 라인.
              작업복의 기능성과 캐주얼의 무드를 동시에 담았습니다.
              2026 FW 출시 예정.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <Link
              href="/products"
              className="inline-block bg-[#ff550c] text-white text-xs font-semibold tracking-widest px-8 py-3 hover:bg-white hover:text-[#1A2B4A] transition-colors text-center"
            >
              현재 제품 보기 →
            </Link>
            <Link
              href="/partnership"
              className="inline-block border border-white/30 text-white/70 text-xs tracking-widest px-8 py-3 hover:border-white hover:text-white transition-colors text-center"
            >
              입점·가맹 문의
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
