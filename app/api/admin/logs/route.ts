import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// 관리자 활동 로그(감사 로그) 조회
// 필터: q(담당자/내용 검색), action, resource, dateStart, dateEnd · 페이지네이션
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q")?.trim();
  const action    = searchParams.get("action");
  const resource  = searchParams.get("resource");
  const dateStart = searchParams.get("dateStart");
  const dateEnd   = searchParams.get("dateEnd");
  const page     = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));

  try {
    const sb = createAdminClient();
    let query = sb
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (action && action !== "all")     query = query.eq("action", action);
    if (resource && resource !== "all") query = query.eq("resource", resource);
    if (q)         query = query.or(`summary.ilike.%${q}%,actor_name.ilike.%${q}%,target.ilike.%${q}%`);
    if (dateStart) query = query.gte("created_at", dateStart);
    if (dateEnd)   query = query.lte("created_at", dateEnd + "T23:59:59");

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ rows: data ?? [], total: count ?? 0, page, pageSize });
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    // 테이블 미생성 시 안내 (마이그레이션 SQL 실행 필요)
    if (msg.includes("audit_logs") && (msg.includes("does not exist") || msg.includes("schema cache"))) {
      return NextResponse.json(
        { error: "audit_logs 테이블이 없습니다. supabase/migrate_add_audit_logs.sql 을 실행해주세요.", needsMigration: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg || "오류가 발생했습니다." }, { status: 500 });
  }
}
