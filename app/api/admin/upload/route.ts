import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { uploadToR2, uniqueKey } from "@/lib/r2-server";

export async function POST(req: Request) {
  // formData 파싱을 포함한 전체를 try/catch로 감싼다 — 파싱 단계에서 에러가 나도
  // (예: 손상된 요청, 예상치 못한 스트림 오류) JSON 없이 그냥 500만 떨어지는 일이 없도록 함.
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

    // Vercel Serverless Function의 요청 바디 한도(4.5MB, 플랫폼 고정값)보다
    // 낮게 잡아 413 대신 이 메시지가 먼저 뜨도록 함.
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 4MB 이하여야 합니다." }, { status: 400 });
    }

    const key = uniqueKey("workup", file.name || "upload.jpg");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToR2(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({ url: result.url });
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.message
        : e != null && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : JSON.stringify(e);
    console.error("[upload] error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
