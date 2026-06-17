import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { maskName, genericContent, type FeedItem } from "@/data/inquiryDummy";

// 공개 엔드포인트: 우측 '문의 현황' 리스트용 통합 피드(더미 + 마스킹된 실제).
// 실제 문의는 이름만 마스킹하고 내용은 일반 문구로 대체해 개인정보를 노출하지 않는다.
export async function GET() {
  noStore();
  try {
    const supabase = createAdminClient();

    const [{ data: dummies }, { data: reals }, { count: dummyCount }, { count: realCount }] = await Promise.all([
      supabase.from("inquiry_dummies").select("id,type,name,content,created_at").order("created_at", { ascending: false }).limit(120),
      supabase.from("inquiries").select("id,type,payload,created_at").order("created_at", { ascending: false }).limit(40),
      supabase.from("inquiry_dummies").select("*", { count: "exact", head: true }),
      supabase.from("inquiries").select("*", { count: "exact", head: true }),
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
        content: genericContent(r.type as string),
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
