import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { maskName, genericContent, type FeedItem } from "@/data/inquiryDummy";

// 공개 엔드포인트: 우측 '문의 현황' 리스트용 통합 피드(더미 + 실제).
// 실제 문의는 이름만 마스킹하고, 제목은 실제 제목을 그대로 노출한다(관리자 목록과 동일).
function feedTitle(p: Record<string, unknown>, type: string): string {
  const t = String(p.title ?? "").trim();
  if (t) return t;
  const body = String(p.message ?? p.content ?? "");
  const first = body.split("\n").map((s) => s.trim()).filter(Boolean)[0] ?? "";
  if (first) return first.length > 60 ? first.slice(0, 60) + "…" : first;
  return genericContent(type); // 제목·내용이 모두 비면 보드가 비지 않도록 일반 문구
}

const PAGE = 1000; // Supabase 요청당 최대 반환 행
const MAX = 5000;  // 보드에 노출할 최대 항목(성능·대역폭 보호)

// 방문마다 재조회하지 않도록 30초 캐시 — 동시 방문자간 Supabase 쿼리를 공유해
// 함수 실행시간·DB egress를 줄인다(새 문의는 최대 30초 지연 반영, 새로고침 버튼으로 즉시 확인 가능).
const fetchFeed = unstable_cache(
  async (t: "franchise" | "wholesale" | null) => {
    const supabase = createAdminClient();

    // 1000행 캡을 넘겨 전량(최대 MAX)을 페이지로 모은다.
    const fetchAll = async (table: "inquiries" | "inquiry_dummies", cols: string) => {
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; from < MAX; from += PAGE) {
        let q = supabase.from(table).select(cols).order("created_at", { ascending: false }).range(from, from + PAGE - 1);
        if (t) q = q.eq("type", t);
        const { data } = await q;
        const page = (data ?? []) as unknown as Record<string, unknown>[];
        rows.push(...page);
        if (page.length < PAGE) break;
      }
      return rows;
    };

    const dc = supabase.from("inquiry_dummies").select("*", { count: "exact", head: true });
    const rc = supabase.from("inquiries").select("*", { count: "exact", head: true });

    const [dummies, reals, { count: dummyCount }, { count: realCount }] = await Promise.all([
      fetchAll("inquiry_dummies", "id,type,name,content,created_at"),
      fetchAll("inquiries", "id,type,payload,created_at"),
      t ? dc.eq("type", t) : dc,
      t ? rc.eq("type", t) : rc,
    ]);

    const dummyItems: FeedItem[] = dummies.map((d) => ({
      id: d.id as string, type: d.type as string, name: d.name as string, content: d.content as string, created_at: d.created_at as string,
      source: "dummy",
    }));
    const realItems: FeedItem[] = reals.map((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      return {
        id: r.id as string,
        type: r.type as string,
        name: maskName(String(p.name ?? p.manager ?? "")),
        content: feedTitle(p, r.type as string),
        created_at: r.created_at as string,
        locked: !!String(p._pwHash ?? "").trim(), // 비밀번호 설정된 글만 열람 가능
        source: "real",
      };
    });

    const items = [...realItems, ...dummyItems]
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id))
      .slice(0, MAX);

    return { items, total: (dummyCount ?? 0) + (realCount ?? 0) };
  },
  ["inquiry-feed"],
  { revalidate: 30 }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tp = searchParams.get("type");
    const t = tp === "franchise" || tp === "wholesale" ? tp : null; // 유형 필터(가맹/입점)
    const result = await fetchFeed(t);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ items: [], total: 0 });
  }
}
