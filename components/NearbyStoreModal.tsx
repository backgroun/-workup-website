"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { stores } from "@/data/stores";

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

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

type NearStore = { id: number; name: string; address: string; distance: number; lat: number; lng: number };

export default function NearbyStoreModal({
  productName,
  onClose,
}: {
  productName: string;
  onClose: () => void;
}) {
  const [nearStores, setNearStores] = useState<NearStore[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrMsg("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const coords = { lat, lng };
        setUserCoords(coords);

        // 1단계: 직선거리 초기 정렬
        const nearest = stores
          .map((s) => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);
        setNearStores(nearest);
        setStatus("success");

        // 2단계: 실제 이동거리로 업데이트
        fetch("/api/route-distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: coords,
            destinations: nearest.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })),
          }),
        })
          .then((r) => r.json())
          .then(({ results }: { results: { id: number; distance: number }[] }) => {
            const dm = new Map(results.map((r) => [r.id, r.distance]));
            setNearStores((prev) =>
              [...prev]
                .map((s) => ({ ...s, distance: dm.get(s.id) ?? s.distance }))
                .sort((a, b) => a.distance - b.distance)
            );
          })
          .catch(() => {});
      },
      (err) => {
        setStatus("error");
        setErrMsg(
          err.code === err.PERMISSION_DENIED
            ? "위치 접근 권한을 허용해 주세요."
            : "위치를 가져올 수 없습니다."
        );
      },
      { timeout: 10000 }
    );
  }, []);

  const openKakao = (s: NearStore) => {
    const dest = `${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
    const url = userCoords
      ? `https://map.kakao.com/link/from/${encodeURIComponent("내 위치")},${userCoords.lat},${userCoords.lng}/to/${dest}`
      : `https://map.kakao.com/link/to/${dest}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-[#1A2B4A] px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-1">내 주변 매장</p>
            <p className="text-base font-bold text-white">{productName}</p>
            <p className="text-xs text-gray-400 mt-0.5">가장 가까운 매장 5곳</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors mt-0.5 flex-shrink-0"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {status === "loading" && (
            <div className="flex items-center gap-3 py-8 text-sm text-gray-500">
              <span className="w-5 h-5 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              위치를 확인하는 중입니다...
            </div>
          )}

          {status === "error" && (
            <div className="py-6">
              <p className="text-sm text-red-500 mb-4">{errMsg}</p>
              <Link
                href="/store"
                onClick={onClose}
                className="inline-block bg-[#1A2B4A] text-white text-xs px-5 py-2.5 hover:bg-[#ff550c] transition-colors"
              >
                전체 매장 보기 →
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="divide-y divide-gray-100">
              {nearStores.map((s, i) => (
                <div key={s.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      i === 0 ? "bg-[#ff550c] text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#1A2B4A]">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.address}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold mb-1 ${i === 0 ? "text-[#ff550c]" : "text-gray-500"}`}>
                      {formatDist(s.distance)}
                    </p>
                    <button
                      onClick={() => openKakao(s)}
                      className="text-xs text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors"
                    >
                      길찾기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Link
            href="/store"
            onClick={onClose}
            className="flex-1 text-center bg-[#1A2B4A] text-white text-xs font-semibold py-3 hover:bg-[#ff550c] transition-colors"
          >
            전체 매장 보기 →
          </Link>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 text-xs py-3 hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
