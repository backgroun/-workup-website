// 탑바 배경에 아주 은은하게 반영할 "오늘의 날씨" 무드 — 타입 / 코드 매핑.
// 순수 함수만 포함 — 클라이언트/서버 양쪽에서 import 가능(topbar.ts와 동일한 분리 원칙).

export type WeatherMood = "clear-day" | "clear-night" | "cloudy" | "rain" | "snow" | "fog";

// Open-Meteo(WMO) 날씨 코드 → 무드. https://open-meteo.com/en/docs 코드 표 기준.
export function wmoCodeToMood(code: number, isDay: boolean): WeatherMood {
  if (code === 0 || code === 1) return isDay ? "clear-day" : "clear-night";
  if (code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return "rain";
  return "cloudy";
}
