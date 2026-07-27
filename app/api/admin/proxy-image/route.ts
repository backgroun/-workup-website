import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 이미지 다운로드
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
    }

    // buffer로 변환
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // content-type 추출
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // data URL 생성
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error("[proxy-image] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
