"use client";
import { useRef, useState } from "react";
import type { MateZoneConfig, Reel } from "@/data/mate-zone";

// MATE ZONE — 릴스(9:16 세로 영상)를 가로 스크롤로 보여준다.
// 영상은 음소거 자동재생/루프(브라우저 자동재생 정책). 카드를 누르면 소리 토글,
// 원본 링크가 있으면 우상단 배지로 인스타그램 등 원본으로 이동한다.

function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) v.play().catch(() => {});
    setMuted(next);
  };

  return (
    <div className="relative flex-shrink-0 w-[240px] md:w-[270px] snap-start">
      <div className="relative aspect-[9/16] bg-black overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.poster_url || undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 소리 토글 */}
        <button
          onClick={toggleSound}
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
          className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          {muted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          )}
        </button>

        {/* 원본 링크 배지(있을 때만) */}
        {reel.link && (
          <a
            href={reel.link}
            target="_blank"
            rel="noopener noreferrer"
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

export default function MateZone({ config }: { config: MateZoneConfig }) {
  // 릴스가 없으면 섹션 자체를 노출하지 않는다(데이터가 쌓이면 표시).
  if (!config.reels.length) return null;

  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="px-[15px] md:px-[70px]">
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.25em] text-[#ff550c] font-bold uppercase mb-2">MATE ZONE</p>
          <h2 className="text-[24px] md:text-[30px] font-bold text-[#1A2B4A] leading-tight">{config.title}</h2>
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
    </section>
  );
}
