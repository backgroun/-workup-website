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
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  count: number;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  count: 0,
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

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
