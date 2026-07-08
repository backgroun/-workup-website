import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
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

export async function GET(req: Request) {
  noStore();
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const tp = searchParams.get("type");
    const t = tp === "franchise" || tp === "wholesale" ? tp : null; // 유형 필터(가맹/입점)

    const dq = supabase.from("inquiry_dummies").select("id,type,name,content,created_at").order("created_at", { ascending: false }).limit(120);
    const rq = supabase.from("inquiries").select("id,type,payload,created_at").order("created_at", { ascending: false }).limit(40);
    const dc = supabase.from("inquiry_dummies").select("*", { count: "exact", head: true });
    const rc = supabase.from("inquiries").select("*", { count: "exact", head: true });

    const [{ data: dummies }, { data: reals }, { count: dummyCount }, { count: realCount }] = await Promise.all([
      t ? dq.eq("type", t) : dq,
      t ? rq.eq("type", t) : rq,
      t ? dc.eq("type", t) : dc,
      t ? rc.eq("type", t) : rc,
    ]);

    const dummyItems: FeedItem[] = (dummies ?? []).map((d) => ({
      id: d.id as string, type: d.type as string, name: d.name as string, content: d.content as string, created_at: d.created_at as string,
    }));
    const realItems: FeedItem[] = (reals ?? []).map((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      return {
        id: r.id as string,
        type: r.type as string,
        name: maskName(String(p.name ?? p.manager ?? "")),
        content: feedTitle(p, r.type as string),
        created_at: r.created_at as string,
      };
    });

    const items = [...realItems, ...dummyItems]
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id))
      .slice(0, 120);

    return NextResponse.json({ items, total: (dummyCount ?? 0) + (realCount ?? 0) });
  } catch {
    return NextResponse.json({ items: [], total: 0 });
  }
}
