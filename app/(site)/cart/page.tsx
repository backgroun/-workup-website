import { getWishlistConfig } from "@/lib/wishlist-server";
import CartView from "@/components/CartView";

// 찜(피팅 리스트) 페이지 — 화면 문구·CTA는 관리자(피킹리스트 관리)에서 설정한 값으로 렌더한다.
export default async function CartPage() {
  const config = await getWishlistConfig();
  return <CartView config={config} />;
}
