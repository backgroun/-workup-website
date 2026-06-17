import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// 브라우저 → Cloudinary 직접 업로드용 서명 발급.
// 대용량 PDF가 Vercel 프록시(~4.5MB)를 우회해 바로 Cloudinary로 올라가도록 한다.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const store = await cookies();
  if (store.get("wu-auth")?.value !== (process.env.AUTH_TOKEN ?? "wu-session-ok")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // folder 를 호출 측에서 지정 가능(기본 brands). 동영상은 workup/videos 로 업로드.
  const body = await req.json().catch(() => ({}));
  const folder = typeof body?.folder === "string" && body.folder ? body.folder : "workup/brands";
  const timestamp = Math.round(Date.now() / 1000);
  // 서명 대상 파라미터(folder, timestamp)는 클라이언트 업로드 시 그대로 전송해야 한다.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
