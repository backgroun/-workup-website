"use client";
import { useState, useEffect, useRef } from "react";

type HeroSlide = {
  id: string;
  season_text: string;
  title: string;
  subtitle: string;
  btn1_text: string;
  btn1_link: string;
  btn1_visible: boolean;
  btn2_text: string;
  btn2_link: string;
  btn2_visible: boolean;
  pc_image_url: string | null;
  mobile_image_url: string | null;
  pc_image_position?: string | null;
  mobile_image_position?: string | null;
  content_x?: number | null;
  content_y?: number | null;
  is_visible: boolean;
  sort_order: number;
};

const AUTO_INTERVAL = 5000;

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const touchStartX = useRef<number | null>(null);

  // 자동 슬라이드 — current 변경 시마다 타이머 리셋
  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % total), AUTO_INTERVAL);
    return () => clearTimeout(t);
  }, [current, total]);

  const navigate = (dir: 1 | -1) => {
    setCurrent((c) => (c + dir + total) % total);
  };

  // 터치 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) navigate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <section
      className="relative bg-[#1A2B4A] overflow-hidden aspect-[750/695] md:aspect-[1920/680]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* 슬라이드 트랙 — section을 absolute로 가득 채운 뒤 translateX 슬라이딩 */}
      <div
        className="absolute inset-0 flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => {
          const pcImage = slide.pc_image_url;
          const mobileImage = slide.mobile_image_url || pcImage;

          return (
            <div
              key={slide.id}
              className="flex-shrink-0 w-full h-full relative flex flex-col justify-center"
            >
              {/* 배경 이미지 — PC/모바일 각각 objectPosition 적용 */}
              {pcImage && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pcImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover hidden md:block"
                    style={{ objectPosition: slide.pc_image_position || "50% 50%" }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mobileImage || pcImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover md:hidden"
                    style={{ objectPosition: slide.mobile_image_position || "50% 50%" }}
                  />
                </>
              )}

              {/* 이미지 없는 슬라이드 — 우측 어두운 액센트 */}
              {!pcImage && (
                <div className="absolute right-0 top-0 h-full w-1/3 bg-[#152238] hidden lg:block" />
              )}

              {/* 텍스트 컨텐츠 — content_x/content_y 기반 절대 위치 */}
              <div
                className="absolute z-[2] max-w-xl"
                style={{
                  left: `${slide.content_x ?? 5}%`,
                  top: `${slide.content_y ?? 35}%`,
                  transform: "translateY(-50%)",
                }}
              >
                <div>
                  {slide.season_text && (
                    <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-6">
                      {slide.season_text}
                    </p>
                  )}
                  {slide.title && (
                    <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6 whitespace-pre-line">
                      {slide.title}
                    </h1>
                  )}
                  {slide.subtitle && (
                    <p className="text-base text-gray-300 leading-relaxed mb-10 whitespace-pre-line">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4">
                    {slide.btn1_visible && slide.btn1_text && (
                      <a
                        href={slide.btn1_link}
                        className="inline-block bg-[#ff550c] text-white text-sm tracking-widest px-8 py-3 hover:bg-[#d05518] transition-colors"
                      >
                        {slide.btn1_text}
                      </a>
                    )}
                    {slide.btn2_visible && slide.btn2_text && (
                      <a
                        href={slide.btn2_link}
                        className="inline-block border border-white text-white text-sm tracking-widest px-8 py-3 hover:bg-white hover:text-[#1A2B4A] transition-colors"
                      >
                        {slide.btn2_text}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 좌우 화살표 (PC 전용) */}
      {total > 1 && (
        <>
          <button
            onClick={() => navigate(-1)}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[3] items-center justify-center p-2 opacity-80 hover:opacity-100 transition-opacity"
            style={{ left: 100 }}
            aria-label="이전 슬라이드"
          >
            <svg
              fill="none"
              stroke="white"
              strokeWidth={1}
              viewBox="0 0 24 24"
              style={{ width: 80, height: 120 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigate(1)}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[3] items-center justify-center p-2 opacity-80 hover:opacity-100 transition-opacity"
            style={{ right: 100 }}
            aria-label="다음 슬라이드"
          >
            <svg
              fill="none"
              stroke="white"
              strokeWidth={1}
              viewBox="0 0 24 24"
              style={{ width: 80, height: 120 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 하단 페이지 카운터 pill */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3]">
          <div className="bg-black/50 backdrop-blur-sm text-white text-sm font-medium px-5 py-2 rounded-full tracking-wide select-none">
            {current + 1}
            <span className="opacity-50 mx-1.5">/</span>
            {total}
          </div>
        </div>
      )}
    </section>
  );
}
