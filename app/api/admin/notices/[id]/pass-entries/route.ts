import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

// 전체 활성 지점을 기준으로, 아직 패스 접수가 없는 지점은 기본값(출고)으로 채워 반환한다.
export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const sb = createAdminClient();

  const { data: stores, error: storesErr } = await sb
    .from("stores")
    .select("id, name, store_code")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (storesErr) return NextResponse.json({ error: storesErr.message }, { status: 500 });

  const { data: entries, error: entriesErr } = await sb
    .from("pass_entries")
    .select("store_id, status, updated_at")
    .eq("notice_id", id);
  if (entriesErr) return NextResponse.json({ error: entriesErr.message }, { status: 500 });

  const byStore = new Map((entries ?? []).map((e) => [e.store_id, e]));
  const rows = (stores ?? []).map((s) => {
    const e = byStore.get(s.id);
    return {
      store_id: s.id,
      store_name: s.name,
      store_code: s.store_code ?? null,
      status: e?.status ?? "출고",
      updated_at: e?.updated_at ?? null,
    };
  });

  return NextResponse.json(rows);
}
