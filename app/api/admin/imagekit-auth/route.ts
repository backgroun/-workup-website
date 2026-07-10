import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getImagekit } from "@/lib/imagekit-server";

// 브라우저 → ImageKit 직접 업로드용 인증 파라미터 발급.
// 대용량 PDF·동영상이 Vercel 프록시(~4.5MB)를 우회해 바로 ImageKit으로 올라가도록 한다.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // folder 를 호출 측에서 지정 가능(기본 brands). 동영상은 workup/videos 로 업로드.
  const body = await req.json().catch(() => ({}));
  const folder = typeof body?.folder === "string" && body.folder ? body.folder : "workup/brands";
  const { token, expire, signature } = getImagekit().helper.getAuthenticationParameters();

  return NextResponse.json({
    token,
    expire,
    signature,
    folder,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}
