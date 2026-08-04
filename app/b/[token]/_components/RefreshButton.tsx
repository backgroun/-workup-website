"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

// 홈 화면에 추가(PWA standalone)해서 접속하면 브라우저 주소창·새로고침 UI가 없어
// 화면 안에 새로고침 버튼이 필요하다.
export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      aria-label="새로고침"
      className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#303236] disabled:opacity-50 transition-colors"
    >
      <svg
        className={`w-[18px] h-[18px] ${pending ? "animate-spin" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 10-2.6 6.4M21 12v-5M21 12h-5" />
      </svg>
    </button>
  );
}
