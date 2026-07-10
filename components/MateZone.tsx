"use client";
import { useRef, useState } from "react";
import type { MateZoneConfig, Reel } from "@/data/mate-zone";

// MATE ZONE — 릴스(9:16 세로 영상)를 가로 스크롤로 보여준다.
// 자동재생하지 않고, 카드를 클릭/터치하면 소리와 함께 재생/일시정지한다(사용자 제스처 기반).

function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="relative flex-shrink-0 w-[240px] md:w-[270px] snap-start">
      <div
        onClick={toggle}
        className="relative aspect-[9/16] bg-black overflow-hidden rounded-lg cursor-pointer group"
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 재생 버튼 — 정지 상태에서만 노출 */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-[#303236] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}

        {/* 원본 링크 배지(있을 때만) — 클릭이 재생 토글로 번지지 않게 차단 */}
        {reel.link && (
          <a
            href={reel.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="원본 보기"
            className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold hover:bg-black/70 transition-colors"
          >
            원본 보기 →
          </a>
        )}
      </div>

      {reel.caption && (
        <p className="mt-2 text-[13px] text-gray-600 leading-snug line-clamp-2">{reel.caption}</p>
      )}
    </div>
  );
}

// MATE 페이지 흐름 안에 임베드되는 하위 영역(독립 섹션 아님 — 부모 컨테이너/배경을 공유).
export default function MateZone({ config }: { config: MateZoneConfig }) {
  // 릴스가 없으면 노출하지 않는다(데이터가 쌓이면 표시).
  if (!config.reels.length) return null;

  return (
    <div className="mt-16 pt-12 border-t border-gray-200">
      <div className="mb-8">
        <h2 className="text-[24px] md:text-[30px] font-bold text-[#303236] leading-tight">{config.title}</h2>
        {config.subtitle && (
          <p className="mt-2 text-[14px] text-gray-500">{config.subtitle}</p>
        )}
      </div>

      {/* 가로 스크롤 릴스 */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:thin]">
        {config.reels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
}
