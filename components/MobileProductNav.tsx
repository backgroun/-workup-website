"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function MobileProductNav() {
  const router = useRouter();
  const { count } = useCart();

  return (
    <div className="md:hidden sticky z-50 bg-white border-b border-gray-200 flex items-center justify-between px-5 h-12" style={{ top: "var(--wu-topbar-h, 36px)" }}>
      <div className="flex items-center gap-5">
        <button onClick={() => router.back()} className="text-gray-700 hover:text-[#1A2B4A] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Link href="/" className="text-gray-700 hover:text-[#1A2B4A] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <Link href="/products" className="text-gray-700 hover:text-[#1A2B4A] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Link>
        <Link href="/cart" className="relative text-gray-700 hover:text-[#1A2B4A] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff550c] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
