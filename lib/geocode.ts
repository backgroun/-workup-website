// 주소 → 좌표(위도·경도) 변환. 카카오 로컬 API(주소 검색) 사용.
// KAKAO_REST_API_KEY 없거나 검색 실패 시 null 반환(호출측에서 좌표 없이 진행).
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  const q = (address ?? "").trim();
  if (!key || !q) return null;
  try {
    const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
    url.searchParams.set("query", q);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.documents?.[0];
    if (!doc) return null;
    // 카카오는 x=경도, y=위도
    const lat = Number(doc.y);
    const lng = Number(doc.x);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
