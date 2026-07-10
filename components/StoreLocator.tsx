"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { type Store } from "@/data/stores";
import KakaoMap from "@/components/KakaoMap";
import { trackStoreEvent } from "@/lib/track";
import { DEFAULT_STORE_PAGE, type StorePageConfig } from "@/lib/store-page";

const NEARBY_COUNT = 5;
const KAKAO_CHANNEL = "https://pf.kakao.com/_workup"; // 실제 채널 URL로 교체
const SIDO_LIST = ["강원","경기","경남","경북","광주","대구","대전","부산","서울","울산","인천","전남","전북","제주","충남","충북"];

type StoreWithDistance = Store & { distance: number; estimated?: boolean };
type LocStatus = "idle" | "loading" | "success" | "error";

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

function formatDist(km: number, estimated?: boolean) {
  const val = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  return estimated ? `~${val}` : val;
}

// 카카오맵 길찾기 버튼 — 위치 없을 때 GPS 자동 요청 후 오픈
function KakaoDirBtn({ store, userCoords: passedCoords }: {
  store: Store;
  userCoords?: { lat: number; lng: number } | null;
}) {
  const [coords, setCoords] = useState(passedCoords ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setCoords(passedCoords ?? null); }, [passedCoords]);

  const openKakao = (c: { lat: number; lng: number } | null) => {
    const dest = `${encodeURIComponent(store.name)},${store.lat},${store.lng}`;
    const url = c
      ? `https://map.kakao.com/link/from/${encodeURIComponent("내 위치")},${c.lat},${c.lng}/to/${dest}`
      : `https://map.kakao.com/link/to/${dest}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClick = () => {
    trackStoreEvent("directions_kakao", { id: store.id, name: store.name });
    if (coords) { openKakao(coords); return; }
    if (!navigator.geolocation) { openKakao(null); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLoading(false);
        openKakao(c);
      },
      () => { setLoading(false); openKakao(null); },
      { timeout: 5000, maximumAge: 30000, enableHighAccuracy: true }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full md:w-auto items-center justify-center gap-1.5 bg-[#FAE100] text-black text-xs px-3 py-2 hover:bg-[#e6cf00] transition-colors disabled:opacity-60"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      {loading ? "확인 중" : "카카오맵"}
    </button>
  );
}

// 네이버맵 길찾기 버튼 — 출발지를 내 위치로 자동 설정 (네이버는 경도,위도 순서)
function NaverDirBtn({ store, userCoords: passedCoords }: {
  store: Store;
  userCoords?: { lat: number; lng: number } | null;
}) {
  const [coords, setCoords] = useState(passedCoords ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setCoords(passedCoords ?? null); }, [passedCoords]);

  const openNaver = (c: { lat: number; lng: number } | null) => {
    const goal = `${store.lng},${store.lat},${encodeURIComponent(store.name)}`;
    const url = c
      ? `https://map.naver.com/p/directions/${c.lng},${c.lat},${encodeURIComponent("내 위치")}/${goal}/-/car`
      : `https://map.naver.com/p/directions/-/${goal}/-/car`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClick = () => {
    trackStoreEvent("directions_naver", { id: store.id, name: store.name });
    if (coords) { openNaver(coords); return; }
    if (!navigator.geolocation) { openNaver(null); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLoading(false);
        openNaver(c);
      },
      () => { setLoading(false); openNaver(null); },
      { timeout: 5000, maximumAge: 30000, enableHighAccuracy: true }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full md:w-auto items-center justify-center gap-1.5 bg-[#03C75A] text-white text-xs px-3 py-2 hover:bg-[#02b350] transition-colors disabled:opacity-60"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      {loading ? "확인 중" : "네이버맵"}
    </button>
  );
}

export default function StoreLocator({
  id,
  stores,
  header = DEFAULT_STORE_PAGE,
}: {
  id?: string;
  stores: Store[];
  header?: StorePageConfig;
}) {
  const [locStatus, setLocStatus] = useState<LocStatus>("idle");
  const [locError, setLocError] = useState("");
  const [nearbyStores, setNearbyStores] = useState<StoreWithDistance[]>([]);
  const [allSorted, setAllSorted] = useState<StoreWithDistance[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState("");

  // 지도 중심 (선택된 매장 or 기본값) — level은 카카오맵 기준 (작을수록 확대)
  const [mapCenter, setMapCenter] = useState({ lat: 37.3205, lng: 127.0423, level: 9 });
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocError("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });

        // 1단계: 직선거리로 초기 정렬
        const sorted = stores
          .map((s) => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng), estimated: true }))
          .sort((a, b) => a.distance - b.distance);
        setAllSorted(sorted);
        setNearbyStores(sorted.slice(0, NEARBY_COUNT));
        setLocStatus("success");
        setShowAll(false);
        setSearch("");
        setExpanded(null);
        setMapCenter({ lat, lng, level: 7 });

        // 2단계: 실제 이동거리로 업데이트 (50km 이내 최대 20개)
        const candidates = sorted.filter((s) => s.distance <= 50).slice(0, 20);
        if (candidates.length > 0) {
          fetch("/api/route-distance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              origin: { lat, lng },
              destinations: candidates.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })),
            }),
          })
            .then((r) => r.json())
            .then(({ results }: { results: { id: number; distance: number; estimated: boolean }[] }) => {
              const distMap = new Map(results.map((r) => [r.id, r]));
              const updated = sorted
                .map((s) => {
                  const r = distMap.get(s.id);
                  return r ? { ...s, distance: r.distance, estimated: r.estimated } : s;
                })
                .sort((a, b) => a.distance - b.distance);
              setAllSorted(updated);
              setNearbyStores(updated.slice(0, NEARBY_COUNT));
            })
            .catch(() => { /* 실패 시 직선거리 유지 */ });
        }
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "위치 접근 권한을 허용해 주세요. 브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭해 위치 권한을 허용하세요."
            : err.code === err.TIMEOUT
            ? "위치 요청 시간이 초과됐습니다. 다시 시도해 주세요."
            : "위치를 가져올 수 없습니다. 기기 위치 서비스를 켜고 다시 시도해 주세요.";
        setLocError(msg);
        setLocStatus("error");
      },
      { timeout: 15000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  // 페이지 진입 시 자동 위치 요청
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { handleLocate(); }, []);

  // 지도에서 보기 — 지도 중심 이동 + 스크롤
  const handleShowOnMap = (store: Store) => {
    setSelectedStore(store);
    setMapCenter({ lat: store.lat, lng: store.lng, level: 3 });
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isSearching = search.trim().length > 0;
  const baseList: StoreWithDistance[] = allSorted.length > 0
    ? allSorted
    : stores.map((s) => ({ ...s, distance: -1 }));
  const hasLocated = locStatus === "success";
  const showNearby = hasLocated && !isSearching && !showAll && nearbyStores.length > 0;

  const sigunguList = selectedSido
    ? Array.from(new Set(stores.filter((s) => s.address.split(" ")[0] === selectedSido).map((s) => s.address.split(" ")[1]))).sort()
    : [];

  const applyRegionFilter = (list: StoreWithDistance[]) => {
    if (!selectedSido) return list;
    return list.filter((s) => {
      const parts = s.address.split(" ");
      if (parts[0] !== selectedSido) return false;
      if (selectedSigungu && parts[1] !== selectedSigungu) return false;
      return true;
    });
  };

  const displayList = applyRegionFilter(
    isSearching
      ? baseList.filter((s) => s.name.includes(search.trim()) || s.address.includes(search.trim()))
      : showNearby
      ? nearbyStores
      : hasLocated && !isSearching
      ? allSorted
      : baseList
  );

  return (
    <section id={id} className="bg-[#F5F2ED]">

      {/* ── 페이지 타이틀 ── */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="px-[15px] md:px-[70px]">
          <h1 className="text-[32px] md:text-[42px] font-bold text-[#1A2B4A] leading-tight mb-4">
            {header.title}
          </h1>
          {header.description && (
            <p className="text-[14px] text-gray-500 leading-relaxed mb-8 whitespace-pre-line">
              {header.description.replace(/\{count\}/g, String(stores.length))}
            </p>
          )}
          {/* 방문 안내 */}
          {header.bullets.length > 0 && (
            <ul className="flex flex-col gap-2">
              {header.bullets.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-500">
                  <span className="text-[#ff550c] font-bold flex-shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-[15px] md:px-[70px] py-10">

        {/* ── 컨트롤 바 ── */}

        {/* PC: 한 줄 — 근처 매장 찾기 | 시/도 | 시/군/구 | 검색 */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <button
            onClick={handleLocate}
            disabled={locStatus === "loading"}
            className="inline-flex items-center justify-center gap-2 bg-[#1A2B4A] text-white text-sm font-semibold px-6 py-3 hover:bg-[#243d5e] transition-colors disabled:opacity-60 whitespace-nowrap flex-shrink-0"
          >
            {locStatus === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                위치 확인 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locStatus === "success" ? "위치 다시 찾기" : "근처 매장 찾기"}
              </>
            )}
          </button>

          <select
            value={selectedSido}
            onChange={(e) => { setSelectedSido(e.target.value); setSelectedSigungu(""); }}
            className="border border-gray-300 bg-white text-sm text-[#1A2B4A] px-3 py-3 focus:outline-none focus:border-[#1A2B4A] flex-shrink-0"
            style={{ minWidth: "120px" }}
          >
            <option value="">시/도 선택</option>
            {SIDO_LIST.map((sido) => (
              <option key={sido} value={sido}>{sido}</option>
            ))}
          </select>

          <select
            value={selectedSigungu}
            onChange={(e) => setSelectedSigungu(e.target.value)}
            disabled={!selectedSido}
            className="border border-gray-300 bg-white text-sm text-[#1A2B4A] px-3 py-3 focus:outline-none focus:border-[#1A2B4A] flex-shrink-0 disabled:opacity-40"
            style={{ minWidth: "130px" }}
          >
            <option value="">시/군/구 선택</option>
            {sigunguList.map((sigungu) => (
              <option key={sigungu} value={sigungu}>{sigungu}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="지역명 또는 매장명 검색 (지역선택없이 검색 가능)"
              className="w-full pl-9 pr-8 py-3 border border-gray-300 bg-white text-sm text-[#1A2B4A] placeholder-gray-400 focus:outline-none focus:border-[#1A2B4A]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* 모바일: 3줄 — 버튼 / 드롭다운 2개 나란히 / 검색 */}
        <div className="flex md:hidden flex-col gap-3 mb-6">
          {/* 줄 1: 근처 매장 찾기 */}
          <button
            onClick={handleLocate}
            disabled={locStatus === "loading"}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1A2B4A] text-white text-sm font-semibold px-6 py-3 hover:bg-[#243d5e] transition-colors disabled:opacity-60"
          >
            {locStatus === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                위치 확인 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locStatus === "success" ? "위치 다시 찾기" : "근처 매장 찾기"}
              </>
            )}
          </button>

          {/* 줄 2: 시/도 + 시/군/구 나란히 */}
          <div className="flex gap-3">
            <select
              value={selectedSido}
              onChange={(e) => { setSelectedSido(e.target.value); setSelectedSigungu(""); }}
              className="flex-1 border border-gray-300 bg-white text-sm text-[#1A2B4A] px-3 py-3 focus:outline-none focus:border-[#1A2B4A]"
            >
              <option value="">시/도 선택</option>
              {SIDO_LIST.map((sido) => (
                <option key={sido} value={sido}>{sido}</option>
              ))}
            </select>
            <select
              value={selectedSigungu}
              onChange={(e) => setSelectedSigungu(e.target.value)}
              disabled={!selectedSido}
              className="flex-1 border border-gray-300 bg-white text-sm text-[#1A2B4A] px-3 py-3 focus:outline-none focus:border-[#1A2B4A] disabled:opacity-40"
            >
              <option value="">시/군/구 선택</option>
              {sigunguList.map((sigungu) => (
                <option key={sigungu} value={sigungu}>{sigungu}</option>
              ))}
            </select>
          </div>

          {/* 줄 3: 검색 (버튼과 동일 너비 = 100%) */}
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="지역명 또는 매장명 검색 (지역선택없이 검색 가능)"
              className="w-full pl-9 pr-8 py-3 border border-gray-300 bg-white text-sm text-[#1A2B4A] placeholder-gray-400 focus:outline-none focus:border-[#1A2B4A]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
        </div>

        {locStatus === "error" && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 px-4 py-3">
            <p className="text-sm font-semibold text-red-700 mb-0.5">위치를 확인할 수 없습니다</p>
            <p className="text-xs text-red-500 leading-relaxed">{locError}</p>
          </div>
        )}

        {/* 근거리 결과 배너 */}
        {locStatus === "success" && !isSearching && (
          <div className={`mb-4 px-4 py-3 border-l-4 flex items-start justify-between gap-4 ${
            nearbyStores.length > 0 ? "border-[#ff550c] bg-orange-50" : "border-gray-300 bg-gray-50"
          }`}>
            <div>
              {nearbyStores.length > 0 ? (
                <>
                  <p className="text-sm font-bold text-[#1A2B4A]">
                    {showAll ? `전국 ${allSorted.length}개 매장 — 거리순` : `가장 가까운 ${NEARBY_COUNT}개 매장`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    가장 가까운 매장: <strong className="text-[#ff550c]">{(showAll ? allSorted : nearbyStores)[0]?.name}</strong>
                    {" "}— {formatDist((showAll ? allSorted : nearbyStores)[0]?.distance, (showAll ? allSorted : nearbyStores)[0]?.estimated)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-600">근처매장이 없습니다.</p>
                  <p className="text-xs text-gray-400 mt-0.5">전체 매장을 거리순으로 보여드립니다.</p>
                </>
              )}
            </div>
            {nearbyStores.length > 0 && (
              <button
                onClick={() => { setShowAll(!showAll); setExpanded(null); }}
                className="flex-shrink-0 text-xs border px-3 py-1.5 border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white transition-colors whitespace-nowrap"
              >
                {showAll ? "근처 매장 찾아보기" : "전체 매장 보기"}
              </button>
            )}
          </div>
        )}

        {/* ── 지도 (카카오맵) ── */}
        <div ref={mapRef} className="relative mb-6">
          <div className="w-full overflow-hidden border border-gray-200 h-[360px] md:h-[520px]">
            <KakaoMap
              stores={stores}
              center={mapCenter}
              selectedStore={selectedStore}
              userCoords={userCoords}
              onStoreSelect={(store) => {
                setSelectedStore(store);
                setMapCenter({ lat: store.lat, lng: store.lng, level: 3 });
              }}
            />
          </div>

          {/* 선택된 매장 — 전체 매장으로 돌아가기 버튼 */}
          {selectedStore && (
            <button
              onClick={() => {
                setSelectedStore(null);
                if (userCoords) {
                  setMapCenter({ lat: userCoords.lat, lng: userCoords.lng, level: 9 });
                } else {
                  setMapCenter({ lat: 37.3205, lng: 127.0423, level: 9 });
                }
                setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white text-[#1A2B4A] text-xs font-semibold px-3 py-2 shadow-md hover:bg-[#1A2B4A] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              전체 매장 보기
            </button>
          )}

          {/* 선택된 매장 오버레이 */}
          {selectedStore && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-[#1A2B4A] px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{selectedStore.name}</p>
                <p className="text-gray-300 text-xs mt-0.5 truncate">{selectedStore.address}</p>
                <p className="text-[#ff550c] text-xs mt-0.5">{selectedStore.hours}</p>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── 매장 목록 ── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">
            {isSearching
              ? `"${search.trim()}" 검색 결과 ${displayList.length}개`
              : showNearby
              ? `가장 가까운 ${NEARBY_COUNT}개 매장 — 거리순`
              : hasLocated
              ? `전체 ${displayList.length}개 매장 — 거리순`
              : `전체 ${displayList.length}개 매장`}
          </p>
          {hasLocated && (
            <p className="text-xs text-gray-400">~표시는 추정 거리, 그 외는 실제 이동거리</p>
          )}
        </div>

        <div className="space-y-2">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">검색 결과가 없습니다.</div>
          ) : (
            displayList.map((store, index) => {
              const isOpen = expanded === store.id;
              return (
                <div key={store.id} className="bg-white border border-gray-200 overflow-hidden">

                  {/* 헤더 */}
                  <button
                    className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      const next = isOpen ? null : store.id;
                      setExpanded(next);
                      if (!isOpen) {
                        trackStoreEvent("list_click", { id: store.id, name: store.name });
                        setSelectedStore(store);
                        setMapCenter({ lat: store.lat, lng: store.lng, level: 5 });
                        mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 && showNearby ? "bg-[#ff550c] text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1A2B4A] text-sm">{store.name}</span>
                          {store.distance >= 0 && (
                            <span className={`text-xs px-2 py-0.5 font-semibold flex-shrink-0 ${
                              index === 0 && showNearby ? "bg-[#ff550c] text-white" : "bg-gray-100 text-gray-600"
                            }`}>
                              {formatDist(store.distance, store.estimated)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate pr-2">{store.address}</p>
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 상세 정보 */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 py-4">
                      {/* 주소 + 운영시간 + 판매제품 */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span>{store.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{store.hours}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{store.phone}</span>
                          </div>
                        </div>

                        {/* 판매제품 — 오른쪽 여백에 번호 + 제품명만 배치 */}
                        {store.products && store.products.length > 0 && (
                          <div className="md:w-56 md:flex-shrink-0 md:border-l md:border-gray-100 md:pl-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2">이 매장 베스트 상품</p>
                            <ul className="space-y-1.5">
                              {store.products.map((p, i) => (
                                <li key={p.id}>
                                  <Link
                                    href={`/products/${p.id}`}
                                    className="flex items-center gap-2 text-xs text-gray-700 hover:text-[#ff550c] transition-colors"
                                  >
                                    <span className="w-4 h-4 flex items-center justify-center bg-[#1A2B4A] text-white text-[10px] font-bold flex-shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="truncate">{p.name}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 — 모바일 2x2 그리드, 데스크탑 한 줄 */}
                      <div className="grid grid-cols-2 gap-2 md:flex">

                        {/* 전화하기 */}
                        <a
                          href={`tel:${store.phone.replace(/-/g, "")}`}
                          onClick={() => trackStoreEvent("call", { id: store.id, name: store.name })}
                          className="flex w-full md:w-auto items-center justify-center gap-1.5 bg-[#1A2B4A] text-white text-xs px-3 py-2 hover:bg-[#243d5e] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          전화
                        </a>

                        {/* 카카오맵 길찾기 */}
                        <KakaoDirBtn store={store} userCoords={userCoords} />

                        {/* 네이버맵 길찾기 */}
                        <NaverDirBtn store={store} userCoords={userCoords} />

                        {/* 매장 소개 페이지 */}
                        {store.pageActive !== false && (
                          <Link
                            href={`/store/${store.id}`}
                            onClick={() => trackStoreEvent("list_click", { id: store.id, name: store.name })}
                            className="flex w-full md:w-auto items-center justify-center gap-1.5 border border-[#1A2B4A] text-[#1A2B4A] text-xs px-3 py-2 hover:bg-[#1A2B4A] hover:text-white transition-colors"
                          >
                            매장소개
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
