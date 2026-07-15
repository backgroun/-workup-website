import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 강제 재배포 트리거 — 신발 카테고리 상품 404 이슈 확인용 (2026-07-15)

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-pathname", request.nextUrl.pathname);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
