import { headers } from "next/headers";
import { wmoCodeToMood, type WeatherMood } from "./weather";

// 방문자 위치 정보가 없을 때(로컬 개발, Vercel 외 배포 등) 쓰는 기본 좌표 — 서울.
const FALLBACK = { lat: 37.5665, lng: 126.978 };

// Open-Meteo는 키가 필요 없는 무료 공개 API — geocode.ts와 동일하게 실패 시 조용히 null 반환한다.
export async function getWeatherMood(): Promise<WeatherMood | null> {
  try {
    const h = await headers();
    const lat = Number(h.get("x-vercel-ip-latitude"));
    const lng = Number(h.get("x-vercel-ip-longitude"));

    // 캐시 적중률을 위해 좌표를 0.1도(약 11km) 단위로 반올림 — 인근 방문자는 같은 fetch 캐시를 공유한다.
    const rLat = Math.round((Number.isFinite(lat) ? lat : FALLBACK.lat) * 10) / 10;
    const rLng = Math.round((Number.isFinite(lng) ? lng : FALLBACK.lng) * 10) / 10;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(rLat));
    url.searchParams.set("longitude", String(rLng));
    url.searchParams.set("current", "weather_code,is_day");
    url.searchParams.set("timezone", "Asia/Seoul");

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const code = data?.current?.weather_code;
    const isDay = data?.current?.is_day === 1;
    if (typeof code !== "number") return null;

    return wmoCodeToMood(code, isDay);
  } catch {
    return null;
  }
}
