import { NextResponse } from "next/server";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { products as staticProducts, isPubliclyVisible, type Product } from "@/data/products";

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
    // Supabase(PostgREST)는 프로젝트의 최대 응답 행수(기본 1000)를 넘으면 응답을 조용히 잘라버린다.
    // 등록 상품이 1000개를 넘으면 뒤쪽(정렬상 뒤 순번) 상품이 고객 화면에서 누락되므로 나눠서 전부 가져온다.
    const PAGE = 1000;
    const rows = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) break;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < PAGE) break;
    }

    if (rows.length === 0) {
      return NextResponse.json(staticProducts.filter(isPubliclyVisible).map(toPublic));
    }

    // 판매중지·진열대기는 고객에게 숨김
    return NextResponse.json(rows.map(mapFromDb).filter(isPubliclyVisible).map(toPublic));
  } catch {
    return NextResponse.json(staticProducts.filter(isPubliclyVisible).map(toPublic));
  }
}
