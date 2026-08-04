import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ token: string }> };

// 지점 담당자가 브라우저 알림을 켜면 브라우저가 만들어주는 구독 정보(endpoint+keys)를 저장한다.
// 지점 인증은 다른 지점 API와 동일하게 토큰 매칭이 전부다.
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const sb = createAdminClient();
  const { data: store } = await sb
    .from("stores")
    .select("id")
    .eq("pass_link_token", token)
    .eq("is_active", true)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: "링크를 찾을 수 없습니다." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const endpoint = body?.endpoint as string | undefined;
  const p256dh = body?.keys?.p256dh as string | undefined;
  const auth = body?.keys?.auth as string | undefined;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "잘못된 구독 정보입니다." }, { status: 400 });
  }

  const { error } = await sb
    .from("push_subscriptions")
    .upsert({ store_id: store.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { token } = await params;
  const sb = createAdminClient();
  const { data: store } = await sb.from("stores").select("id").eq("pass_link_token", token).maybeSingle();
  if (!store) return NextResponse.json({ error: "링크를 찾을 수 없습니다." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const endpoint = body?.endpoint as string | undefined;
  if (!endpoint) return NextResponse.json({ error: "endpoint가 필요합니다." }, { status: 400 });

  const { error } = await sb.from("push_subscriptions").delete().eq("store_id", store.id).eq("endpoint", endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
