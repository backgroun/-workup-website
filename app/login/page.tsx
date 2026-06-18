import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 | WORKUP",
  description: "WORKUP 파트너 전용 로그인",
};

export default async function LoginPage() {
  // 이미 로그인된 경우 바로 이동
  const cookieStore = await cookies();
  const token = cookieStore.get("wu-auth")?.value;
  const validToken = process.env.AUTH_TOKEN ?? "wu-session-ok";
  if (token === validToken) redirect("/admin");

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F5F2ED] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* 브랜드 헤더 */}
        <div className="bg-[#1A2B4A] px-10 py-10 mb-0">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">Members Only</p>
          <h1 className="flex items-center gap-2.5 mb-2">
            <Image
              src="/images/logo_black.png"
              alt="WORKUP"
              width={130}
              height={18}
              className="h-[18px] w-auto brightness-0 invert"
              priority
            />
            <span className="text-xl font-bold text-white">파트너</span>
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            관리자 및 파트너 전용 로그인입니다.
          </p>
        </div>

        {/* 폼 영역 */}
        <div className="bg-white px-10 py-10 border border-t-0 border-gray-100">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 WORKUP. 파트너 전용 페이지입니다.
        </p>
      </div>
    </main>
  );
}
