"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type CartItem = {
  cartId: string;
  productId: string;
  name: string;
  sku?: string;
  line: string;
  price: string;
  size: string;
  color: string;
  colorHex: string;
  bg: string;
  imageUrl?: string;
  allSizes?: string[];
  allColors?: { name: string; hex: string }[];
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  count: number;
  hasProduct: (productId: string) => boolean;
  toggleProduct: (item: Omit<CartItem, "cartId">) => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  count: 0,
  hasProduct: () => false,
  toggleProduct: () => {},
});

export const FITTING_LIST_KEY = "workup-fitting-list";

function readLocal(): CartItem[] {
  try {
    const saved = localStorage.getItem(FITTING_LIST_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  try {
    localStorage.setItem(FITTING_LIST_KEY, JSON.stringify(items));
  } catch {}
}

// 서버 저장용 최소 필드(제품 정보는 서버가 products 에서 조립한다)
function toPayload(i: Pick<CartItem, "productId" | "size" | "color" | "colorHex">) {
  return { productId: i.productId, size: i.size, color: i.color, colorHex: i.colorHex };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // 로그인 회원 id. null = 비로그인(로컬 저장만 사용)
  const memberIdRef = useRef<string | null>(null);

  // 1) 로컬 캐시를 즉시 반영 (비로그인 사용자는 이 상태로 계속 사용)
  useEffect(() => {
    setItems(readLocal());
  }, []);

  // 2) 로그인 상태면 서버와 동기화한다.
  //    기기에 쌓여 있던 찜은 계정으로 병합한 뒤, 서버 목록을 기준으로 삼는다.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let me: { id?: string | number } | null = null;
      try {
        me = await fetch("/api/member/me").then((r) => r.json());
      } catch {}
      if (cancelled) return;

      const memberId = me?.id != null ? String(me.id) : null;
      memberIdRef.current = memberId;
      if (!memberId) return; // 비로그인: 로컬 저장만 사용

      const local = readLocal();
      if (local.length > 0) {
        try {
          await fetch("/api/member/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: local.map(toPayload) }),
          });
        } catch {}
      }

      try {
        const res = await fetch("/api/member/wishlist");
        if (!res.ok) return; // 테이블 미생성(503) 등 — 로컬 상태 유지
        const server = await res.json();
        if (!cancelled && Array.isArray(server)) {
          setItems(server);
          writeLocal(server);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    writeLocal(next);
  }, []);

  // 서버 반영은 비차단 — 실패해도 화면 동작을 막지 않는다.
  const serverAdd = (item: Pick<CartItem, "productId" | "size" | "color" | "colorHex">) => {
    if (!memberIdRef.current) return;
    fetch("/api/member/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(item)),
    }).catch(() => {});
  };

  // size/color 를 넘기지 않으면 해당 제품의 찜을 모두 삭제한다.
  const serverRemove = (productId: string, size?: string, color?: string) => {
    if (!memberIdRef.current) return;
    const q = new URLSearchParams({ productId });
    if (size !== undefined) q.set("size", size);
    if (color !== undefined) q.set("color", color);
    fetch(`/api/member/wishlist?${q.toString()}`, { method: "DELETE" }).catch(() => {});
  };

  const serverClear = () => {
    if (!memberIdRef.current) return;
    fetch("/api/member/wishlist?all=1", { method: "DELETE" }).catch(() => {});
  };

  const addItem = useCallback((item: Omit<CartItem, "cartId">) => {
    const cartId = `${item.productId}-${item.size}-${item.color}-${Date.now()}`;
    persist([...items, { ...item, cartId }]);
    serverAdd(item);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const removeItem = useCallback((cartId: string) => {
    const target = items.find((i) => i.cartId === cartId);
    persist(items.filter((i) => i.cartId !== cartId));
    if (target) serverRemove(target.productId, target.size, target.color);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const clearCart = useCallback(() => {
    persist([]);
    serverClear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 제품 단위 찜 토글 (카드 하트용) — 같은 productId가 있으면 모두 제거, 없으면 추가.
  const hasProduct = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggleProduct = useCallback((item: Omit<CartItem, "cartId">) => {
    if (items.some((i) => i.productId === item.productId)) {
      persist(items.filter((i) => i.productId !== item.productId));
      serverRemove(item.productId);
    } else {
      const cartId = `${item.productId}-${item.size}-${item.color}-${Date.now()}`;
      persist([...items, { ...item, cartId }]);
      serverAdd(item);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, count: items.length, hasProduct, toggleProduct }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
