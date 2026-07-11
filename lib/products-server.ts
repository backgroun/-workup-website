import { unstable_cache } from "next/cache";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { products as staticProducts, isPubliclyVisible, type Product } from "@/data/products";

// 공개 응답에서 내부 단가(공급가)를 제거한다. 소비자가(consumerPrice)는 고객 노출용이라 유지.
function toPublic(p: Product): Product {
  const clone = { ...p };
  delete clone.supplyPrice;
  return clone;
}

// 공개 제품 목록(/api/products, 홈 신상품·제품 리스트에서 사용)을 캐싱한다.
// 이전에는 매 요청마다 Supabase를 직접 조회(revalidate:0)했는데, 방문자 수만큼
// DB 쿼리가 반복되고 CDN 캐시도 항상 MISS였다. 관리자 상품 저장 시
// revalidateTag("products")로 즉시 갱신되므로 5분 캐시로도 최신성에 문제없다.
export const getPublicProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error || !data || data.length === 0) {
        return staticProducts.filter(isPubliclyVisible).map(toPublic);
      }
      // 판매중지·진열대기는 고객에게 숨김
      return data.map(mapFromDb).filter(isPubliclyVisible).map(toPublic);
    } catch {
      return staticProducts.filter(isPubliclyVisible).map(toPublic);
    }
  },
  ["public-products"],
  { tags: ["products"], revalidate: 300 }
);
