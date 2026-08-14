"use client";
import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

/**
 * /admin 하위 라우트의 본문 쉘을 경로에 따라 분기한다.
 * - 기본: 기존 AdminShell(좌측 사이드바 + 멀티탭) — 기존 관리자 화면은 영향 없음.
 * - /admin/influencer-hub/*: Influencer Hub가 자체 3단 Shell(IHShell)을 제공하므로
 *   여기서는 그대로 통과시킨다(이중 사이드바 방지).
 */
export default function AdminShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/influencer-hub")) {
    return <>{children}</>;
  }
  return <AdminShell>{children}</AdminShell>;
}
