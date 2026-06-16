"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type WishlistContextType = {
  isLoggedIn: boolean;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => void;
  loginModalOpen: boolean;
  closeLoginModal: () => void;
  confirmLogin: () => void;
};

const WishlistContext = createContext<WishlistContextType>({
  isLoggedIn: false,
  isWishlisted: () => false,
  toggleWishlist: () => {},
  loginModalOpen: false,
  closeLoginModal: () => {},
  confirmLogin: () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const router = useRouter();

  // 로그인 상태 확인
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setIsLoggedIn(d.loggedIn ?? false))
      .catch(() => {});
  }, []);

  // 위시리스트 localStorage 로드
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const saved = localStorage.getItem("workup-wishlist");
      if (saved) setWishlist(new Set(JSON.parse(saved)));
    } catch {}
  }, [isLoggedIn]);

  const save = (next: Set<string>) => {
    setWishlist(new Set(next));
    localStorage.setItem("workup-wishlist", JSON.stringify([...next]));
  };

  const isWishlisted = useCallback((id: string) => wishlist.has(id), [wishlist]);

  const toggleWishlist = useCallback((id: string) => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    const next = new Set(wishlist);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    save(next);
  }, [isLoggedIn, wishlist]);

  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  const confirmLogin = useCallback(() => {
    setLoginModalOpen(false);
    router.push("/login");
  }, [router]);

  return (
    <WishlistContext.Provider value={{ isLoggedIn, isWishlisted, toggleWishlist, loginModalOpen, closeLoginModal, confirmLogin }}>
      {children}
      {loginModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeLoginModal} />
          <div className="relative bg-white rounded-sm shadow-xl px-10 py-8 flex flex-col items-center gap-6 min-w-[280px]">
            <p className="text-[15px] text-[#1A2B4A] font-medium text-center leading-relaxed">
              로그인이 필요한 서비스 입니다.<br />로그인 하시겠습니까?
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={closeLoginModal}
                className="flex-1 h-11 border border-gray-300 text-[14px] text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmLogin}
                className="flex-1 h-11 bg-[#1A2B4A] text-white text-[14px] font-medium hover:bg-[#15223b] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
