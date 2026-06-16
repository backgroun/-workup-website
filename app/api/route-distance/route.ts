import { NextRequest, NextResponse } from "next/server";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  const { origin, destinations } = (await req.json()) as {
    origin: { lat: number; lng: number };
    destinations: { id: number; lat: number; lng: number }[];
  };

  const apiKey = process.env.KAKAO_REST_API_KEY;

  // API 키 없으면 직선거리 × 1.3 으로 반환
  if (!apiKey) {
    return NextResponse.json({
      results: destinations.map((d) => ({
        id: d.id,
        distance: haversine(origin.lat, origin.lng, d.lat, d.lng) * 1.3,
        estimated: true,
      })),
    });
  }

  // Kakao Mobility API 병렬 호출
  const settled = await Promise.allSettled(
    destinations.map(async (dest) => {
      const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
      url.searchParams.set("origin", `${origin.lng},${origin.lat}`);
      url.searchParams.set("destination", `${dest.lng},${dest.lat}`);
      url.searchParams.set("summary", "true");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        next: { revalidate: 3600 },
      });

      if (!res.ok) throw new Error(`${res.status}`);

      const data = await res.json();
      const meters = data.routes?.[0]?.summary?.distance;
      if (!meters) throw new Error("no route");

      return { id: dest.id, distance: meters / 1000, estimated: false };
    })
  );

  const results = settled.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          id: destinations[i].id,
          distance: haversine(origin.lat, origin.lng, destinations[i].lat, destinations[i].lng) * 1.3,
          estimated: true,
        }
  );

  return NextResponse.json({ results });
}
