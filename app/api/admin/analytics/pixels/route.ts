import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    await logAudit({
      action: "update",
      resource: "analytics",
      resourceLabel: "분석/픽셀",
      summary: "픽셀/광고 설정 수정",
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
