"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStores } from "@/lib/useStores";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// PR룸 게시글 하단 오프라인 전환 CTA — 위치 확인에 성공하면 가장 가까운 매장의 전화번호로,
// 실패·거부 시엔 본사 대표번호(fallbackPhone)로 조용히 표시한다(권한 팝업 외 별도 로딩 UI 없음).
export default function NearestStoreCta({ fallbackPhone }: { fallbackPhone: string }) {
  const stores = useStores();
  const [nearest, setNearest] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation || stores.length === 0) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const closest = stores
          .map((s) => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng) }))
          .sort((a, b) => a.distance - b.distance)[0];
        if (closest) setNearest({ name: closest.name, phone: closest.phone });
      },
      () => {},
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [stores]);

  const phone = nearest?.phone || fallbackPhone;
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <p className="text-[15px] font-bold text-[#303236] mb-1">매장에서 직접 만나보세요</p>
      <p className="text-[13px] text-gray-500 mb-5">가까운 워크업 매장에서 제품을 체험하고 상담받으실 수 있습니다.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/store"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#303236] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#22365c] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          가까운 매장 찾기
        </Link>
        <a
          href={telHref}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-[#E5541B] text-[#E5541B] text-sm font-semibold py-3 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          전화 문의 {phone}{nearest && ` (${nearest.name})`}
        </a>
      </div>
    </div>
  );
}
