"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// 홈 화면에 추가(PWA standalone)해서 접속하면 브라우저 주소창·새로고침 UI가 없어
// 화면 안에 새로고침 버튼이 필요하다.
export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const wasPending = useRef(false);

  // pending이 true → false로 바뀌는 시점(새로고침 완료)에만 안내를 띄운다.
  useEffect(() => {
    if (wasPending.current && !pending) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2000);
      wasPending.current = pending;
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        aria-label="새로고침"
        className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#303236] disabled:opacity-50 transition-colors"
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
      {showToast && (
        <div className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 bg-[#303236] text-white text-[11.5px] font-semibold rounded-lg whitespace-nowrap shadow-lg z-20">
          새로고침 되었습니다
        </div>
      )}
    </div>
  );
}
