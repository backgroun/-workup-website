"use client";
import { usePathname } from "next/navigation";

// 공지 탑바를 감싸 /story 에서만 숨긴다. 클라이언트 경로 기준이라 페이지 이동(soft navigation) 시에도
// 즉시 갱신된다(서버 레이아웃의 headers()는 soft navigation 에서 재실행되지 않아 상태가 고정되는 문제를 회피).
export default function StoryAwareTopbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/story") return null;
  return <>{children}</>;
}
