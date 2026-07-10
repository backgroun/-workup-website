import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { getProductById } from "@/data/products";

// 회원별 찜(피팅 리스트). 로그인 회원만 사용하며, 비로그인은 클라이언트 localStorage 를 그대로 쓴다.
// 제품 정보는 저장하지 않고 products 에서 최신값을 조회해 조립한다(가격·이미지 변경 자동 반영).

type WishRow = { id: number; product_id: string; size: string; color: string; color_hex: string };

async function getMemberId(): Promise<string | null> {
  const store = await cookies();
  const memberId = store.get("wu-member")?.value;
  if (!memberId) return null;

  const sb = createAdminClient();
  const { data } = await sb.from("members").select("id, status").eq("id", memberId).maybeSingle();
  if (!data || data.status === "withdrawn") return null;
  return memberId;
}

function isMissingTable(msg: string): boolean {
  return msg.includes("wishlist_items") && (msg.includes("does not exist") || msg.includes("schema cache"));
}

// 내 찜 목록 — CartItem 형태로 반환
export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json([], { status: 401 });

  try {
    const sb = createAdminClient();
    const { data: rows, error } = await sb
      .from("wishlist_items")
      .select("id, product_id, size, color, color_hex")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ error: "찜 연동 준비 중입니다.", needsMigration: true }, { status: 503 });
      }
      throw error;
    }

    const list = (rows ?? []) as WishRow[];
    if (list.length === 0) return NextResponse.json([]);

    const { data: products } = await sb
      .from("products")
      .select("*")
      .in("id", list.map((r) => r.product_id));

    const byId = new Map((products ?? []).map((row) => [row.id as string, mapFromDb(row)]));

    // DB에 없으면 정적 제품 데이터로 폴백한다(정적 제품은 슬러그 id 사용).
    // 어디에도 없는 제품(삭제됨)은 목록에서 제외한다.
    const items = list.flatMap((r) => {
      const p = byId.get(r.product_id) ?? getProductById(r.product_id);
      if (!p) return [];
      return [{
        cartId: `srv-${r.id}`,
        productId: r.product_id,
        name: p.name,
        sku: p.sku,
        line: p.line ?? "",
        price: p.price ?? "",
        size: r.size,
        color: r.color,
        colorHex: r.color_hex,
        bg: p.bg ?? "bg-[#303236]",
        imageUrl: p.imageUrl,
        allSizes: p.sizes ?? [],
        allColors: p.colors ?? [],
      }];
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "찜 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

// 찜 추가 (배열로 여러 건 동시 처리 — 로그인 시 로컬 찜 병합에도 사용)
export async function POST(req: Request) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  type WishInsert = { member_id: string; product_id: string; size: string; color: string; color_hex: string };

  const body = await req.json().catch(() => ({}));
  const raw: unknown[] = Array.isArray(body.items) ? body.items : [body];
  const rows: WishInsert[] = raw
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it): WishInsert => ({
      member_id: memberId,
      product_id: String(it.productId ?? ""),
      size: String(it.size ?? ""),
      color: String(it.color ?? ""),
      color_hex: String(it.colorHex ?? ""),
    }))
    .filter((r: WishInsert) => !!r.product_id);

  if (rows.length === 0) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  try {
    const sb = createAdminClient();
    // 중복(같은 제품·사이즈·색상)은 무시하고 새 항목만 추가
    const { error } = await sb
      .from("wishlist_items")
      .upsert(rows, { onConflict: "member_id,product_id,size,color", ignoreDuplicates: true });

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ error: "찜 연동 준비 중입니다.", needsMigration: true }, { status: 503 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "찜을 저장하지 못했습니다." }, { status: 500 });
  }
}

// 찜 삭제 — ?productId=X (해당 제품 전체) / &size=&color= (특정 조합) / ?all=1 (전체 비우기)
export async function DELETE(req: Request) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const size = searchParams.get("size");
  const color = searchParams.get("color");
  const all = searchParams.get("all");

  try {
    const sb = createAdminClient();
    let q = sb.from("wishlist_items").delete().eq("member_id", memberId);

    if (all === "1") {
      // 전체 비우기 — 추가 조건 없음
    } else if (productId) {
      q = q.eq("product_id", productId);
      if (size !== null)  q = q.eq("size", size);
      if (color !== null) q = q.eq("color", color);
    } else {
      return NextResponse.json({ error: "대상이 지정되지 않았습니다." }, { status: 400 });
    }

    const { error } = await q;
    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ error: "찜 연동 준비 중입니다.", needsMigration: true }, { status: 503 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "찜을 삭제하지 못했습니다." }, { status: 500 });
  }
}
