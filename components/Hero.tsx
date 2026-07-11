import { getActiveSlides } from "@/lib/hero-server";
import HeroCarousel from "./HeroCarousel";

// slideType: "main"(홈) | "product"(프로덕트 상단). product는 슬라이드가 없으면 아무것도 렌더하지 않음.
export default async function Hero({ slideType = "main" }: { slideType?: string }) {
  const slides = await getActiveSlides(slideType);
  if (slides.length === 0) return slideType === "main" ? <HeroDefault /> : null;
  return <HeroCarousel slides={slides} />;
}

function HeroDefault() {
  return (
    <section className="relative bg-[#303236] overflow-hidden min-h-[520px] md:min-h-[700px] flex flex-col justify-center">
      <div className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="max-w-2xl">
          <p className="text-xs tracking-widest text-[#E5541B] uppercase mb-6">
            2026 Summer Collection
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            일하는 사람이
            <br />
            제일 멋있다.
          </h1>
          <p className="text-base text-gray-300 leading-relaxed mb-10">
            워크업은 일하는 사람 편에서 만든 옷입니다.
            <br />
            현장부터 일상까지, 버티는 옷.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/site"
              className="inline-block bg-[#E5541B] text-white text-sm tracking-widest px-8 py-3 hover:bg-[#d05518] transition-colors"
            >
              컬렉션 보기
            </a>
            <a
              href="/story"
              className="inline-block border border-white text-white text-sm tracking-widest px-8 py-3 hover:bg-white hover:text-[#303236] transition-colors"
            >
              브랜드 스토리
            </a>
          </div>
        </div>
      </div>
      <div className="absolute right-0 top-0 h-full w-1/3 bg-[#152238] hidden lg:block" />
    </section>
  );
}
