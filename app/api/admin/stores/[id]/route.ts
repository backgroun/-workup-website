import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { geocodeAddress } from "@/lib/geocode";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("stores").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  // 좌표 결정: 폼에는 좌표 입력이 없으므로 기존 좌표를 보존한다.
  // 주소가 바뀌었으면 지오코딩으로 새 좌표를 구하고, 실패 시 기존 좌표 유지.
  let lat = body.lat ?? null;
  let lng = body.lng ?? null;
  if (lat == null || lng == null) {
    const { data: existing } = await supabase
      .from("stores")
      .select("lat, lng, address")
      .eq("id", id)
      .single();
    if (existing) {
      if (existing.address === body.address && existing.lat != null) {
        lat = existing.lat;
        lng = existing.lng;
      } else {
        const geo = await geocodeAddress(body.address);
        if (geo) { lat = geo.lat; lng = geo.lng; }
        else { lat = existing.lat; lng = existing.lng; }
      }
    }
  }

  const { data, error } = await supabase
    .from("stores")
    .update({
      name: body.name,
      region: body.region ?? "",
      address: body.address,
      lat,
      lng,
      hours: body.hours ?? "",
      phone: body.phone ?? "",
      description: body.description ?? "",
      image_urls: body.image_urls ?? [],
      brands: body.brands ?? [],
      parking: body.parking ?? false,
      is_active: body.is_active ?? true,
      page_active: body.page_active ?? true,
      store_type: body.store_type ?? "직영점",
      kakao_channel_url: body.kakao_channel_url ?? "",
      store_url: body.store_url ?? "",
      sort_order: body.sort_order ?? 0,
      product_ids: body.product_ids ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "update",
    resource: "stores",
    resourceLabel: "매장",
    target: data?.name ?? body?.name,
    targetId: id,
  });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "delete",
    resource: "stores",
    resourceLabel: "매장",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
