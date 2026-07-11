import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyMemberCookie } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const memberId = verifyMemberCookie(cookieStore.get("wu-member")?.value);
    if (!memberId) return NextResponse.json(null);

    const sb = createAdminClient();
    const { data: member } = await sb
      .from("members")
      .select("id, name, email, grade, status")
      .eq("id", memberId)
      .maybeSingle();

    if (!member || member.status === "withdrawn" || member.status === "dormant") {
      const store = await cookies();
      store.delete("wu-member");
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      email: member.email,
      grade: member.grade,
    });
  } catch {
    return NextResponse.json(null);
  }
}
