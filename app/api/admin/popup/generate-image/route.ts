import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." },
      { status: 500 }
    );
  }

  const { prompt, size } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "이미지 프롬프트가 없습니다." }, { status: 400 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // DALL-E 3 지원 사이즈: 1024x1024 / 1792x1024 / 1024x1792
  const imgSize: "1024x1024" | "1792x1024" | "1024x1792" =
    size === "wide" ? "1792x1024" : size === "tall" ? "1024x1792" : "1024x1024";

  let b64 = "";
  try {
    const result = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: imgSize,
      response_format: "b64_json",
      n: 1,
    });
    b64 = result.data?.[0]?.b64_json ?? "";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[popup/generate-image] OpenAI error:", e);
    return NextResponse.json({ error: `이미지 생성 실패: ${msg}` }, { status: 500 });
  }

  if (!b64) return NextResponse.json({ error: "이미지 데이터를 받지 못했습니다." }, { status: 500 });

  // DALL-E가 주는 URL은 1시간 후 만료되므로 Cloudinary에 영구 저장
  try {
    const buffer = Buffer.from(b64, "base64");
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "workup/popup-ai", resource_type: "image" }, (err, res) => {
          if (err) return reject(err);
          if (!res) return reject(new Error("no response from cloudinary"));
          resolve(res as { secure_url: string });
        })
        .end(buffer);
    });
    return NextResponse.json({ url: uploaded.secure_url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[popup/generate-image] Cloudinary error:", e);
    return NextResponse.json({ error: `이미지 저장 실패: ${msg}` }, { status: 500 });
  }
}
