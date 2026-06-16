import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function checkAuth() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function GET() {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb.from("pixel_settings").select("*").order("id");
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("pixel_settings")
      .upsert({
        platform:   body.platform,
        pixel_id:   body.pixel_id   ?? "",
        enabled:    body.enabled    ?? false,
        extra:      body.extra      ?? {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "platform" })
      .select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
