import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";

// "모바일 뷰어" 로그인 없이 접근 — site_settings.ih_mobile_viewer에 토큰을 저장해두고,
// /ih-mobile/[token]이 이 토큰과 일치할 때만 데이터를 보여준다(관리자 계정 로그인 없이도 링크만 알면 열람 가능).
// 링크는 PC 관리자 화면(/admin/influencer-hub/mobile, 로그인 필요)에서만 확인/재발급할 수 있다.
const SECTION = "ih_mobile_viewer";

export async function getIHMobileViewerToken(): Promise<string | null> {
  noStore();
  try {
    const sb = createAdminClient();
    const { data } = await sb.from("site_settings").select("config").eq("section", SECTION).maybeSingle();
    const token = (data?.config as { token?: string } | null)?.token;
    return token && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export async function isValidIHMobileViewerToken(token: string): Promise<boolean> {
  if (!token) return false;
  const stored = await getIHMobileViewerToken();
  return stored != null && stored === token;
}
