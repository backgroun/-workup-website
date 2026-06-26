import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: body.name,
      region: body.region ?? "",
      address: body.address,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      hours: body.hours ?? "",
      phone: body.phone ?? "",
      description: body.description ?? "",
      image_urls: body.image_urls ?? [],
      brands: body.brands ?? [],
      parking: body.parking ?? false,
      is_active: body.is_active ?? true,
      store_type: body.store_type ?? "직영점",
      kakao_channel_url: body.kakao_channel_url ?? "",
      store_url: body.store_url ?? "",
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
