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
        className="px-4 py-2 rounded-lg text-[13.5px] font-bold whitespace-nowrap border-2 border-[#303236] text-[#303236] hover:bg-[#303236] hover:text-white disabled:opacity-50 transition-colors"
      >
        {pending ? "새로고침 중..." : "새로고침"}
      </button>
      {showToast && (
        <div className="absolute top-full right-0 mt-1.5 px-2.5 py-1.5 bg-[#303236] text-white text-[11.5px] font-semibold rounded-lg whitespace-nowrap shadow-lg z-20">
          새로고침 되었습니다
        </div>
      )}
    </div>
  );
}
