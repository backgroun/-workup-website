"use client";
import { useState } from "react";
import { trackStoreEvent } from "@/lib/track";

type Props = {
  storeId: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

// 길찾기 버튼 — 클릭 시 GPS로 출발지를 '내 위치'로 채워 지도 앱/웹을 연다.
// 카카오는 좌표 순서가 (위도, 경도), 네이버는 (경도, 위도)로 서로 반대인 점에 주의.
export default function DirectionButtons({ storeId, name, address, lat, lng }: Props) {
  const [loading, setLoading] = useState<"kakao" | "naver" | null>(null);
  const hasCoords = lat != null && lng != null;

  const buildKakao = (c: { lat: number; lng: number } | null) => {
    if (!hasCoords) return `https://map.kakao.com/link/search/${encodeURIComponent(address)}`;
    const dest = `${encodeURIComponent(name)},${lat},${lng}`;
    return c
      ? `https://map.kakao.com/link/from/${encodeURIComponent("내 위치")},${c.lat},${c.lng}/to/${dest}`
      : `https://map.kakao.com/link/to/${dest}`;
  };

  const buildNaver = (c: { lat: number; lng: number } | null) => {
    if (!hasCoords) return `https://map.naver.com/p/search/${encodeURIComponent(address)}`;
    const goal = `${lng},${lat},${encodeURIComponent(name)}`;
    return c
      ? `https://map.naver.com/p/directions/${c.lng},${c.lat},${encodeURIComponent("내 위치")}/${goal}/-/car`
      : `https://map.naver.com/p/directions/-/${goal}/-/car`;
  };

  const handle = (which: "kakao" | "naver") => {
    trackStoreEvent(which === "kakao" ? "directions_kakao" : "directions_naver", { id: storeId, name });
    const build = which === "kakao" ? buildKakao : buildNaver;
    const go = (c: { lat: number; lng: number } | null) =>
      window.open(build(c), "_blank", "noopener,noreferrer");
    if (!navigator.geolocation) { go(null); return; }
    setLoading(which);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoading(null); go({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { setLoading(null); go(null); },
      { timeout: 5000, maximumAge: 30000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => handle("kakao")}
        disabled={loading === "kakao"}
        className="flex items-center justify-center gap-2 w-full py-4 bg-[#303236] text-white font-bold text-base rounded-xl hover:bg-[#243a63] transition-colors disabled:opacity-70"
      >
        <PinIcon />
        {loading === "kakao" ? "위치 확인 중..." : "카카오맵"}
      </button>
      <button
        onClick={() => handle("naver")}
        disabled={loading === "naver"}
        className="flex items-center justify-center gap-2 w-full py-4 bg-[#03C75A] text-white font-bold text-base rounded-xl hover:bg-[#02b350] transition-colors disabled:opacity-70"
      >
        <PinIcon />
        {loading === "naver" ? "위치 확인 중..." : "네이버맵"}
      </button>
    </div>
  );
}

function PinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
