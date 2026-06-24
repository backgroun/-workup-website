import { NextResponse } from "next/server";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { products as staticProducts, type Product } from "@/data/products";

export const revalidate = 0;

// 공개 응답에서 내부 단가(공급가)를 제거한다. 소비자가(consumerPrice)는 고객 노출용이라 유지.
function toPublic(p: Product): Product {
  const clone = { ...p };
  delete clone.supplyPrice;
  return clone;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(staticProducts.map(toPublic));
    }

    return NextResponse.json(data.map(mapFromDb).map(toPublic));
  } catch {
    return NextResponse.json(staticProducts.map(toPublic));
  }
}
