"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type CartItem = {
  cartId: string;
  productId: string;
  name: string;
  line: string;
  price: string;
  size: string;
  color: string;
  colorHex: string;
  bg: string;
  imageUrl?: string;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("workup-fitting-list");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem("workup-fitting-list", JSON.stringify(next));
  };

  const addItem = useCallback((item: Omit<CartItem, "cartId">) => {
    const cartId = `${item.productId}-${item.size}-${item.color}-${Date.now()}`;
    save([...items, { ...item, cartId }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const removeItem = useCallback((cartId: string) => {
    save(items.filter((i) => i.cartId !== cartId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const clearCart = useCallback(() => {
    save([]);
  }, []);

  // 제품 단위 찜 토글 (카드 하트용) — 같은 productId가 있으면 모두 제거, 없으면 추가.
  const hasProduct = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggleProduct = useCallback((item: Omit<CartItem, "cartId">) => {
    if (items.some((i) => i.productId === item.productId)) {
      save(items.filter((i) => i.productId !== item.productId));
    } else {
      const cartId = `${item.productId}-${item.size}-${item.color}-${Date.now()}`;
      save([...items, { ...item, cartId }]);
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
