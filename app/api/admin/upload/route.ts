import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getImagekit } from "@/lib/imagekit-server";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
  }

  try {
    const result = await getImagekit().files.upload({
      file,
      fileName: file.name || "upload.jpg",
      folder: "/workup",
      useUniqueFileName: true,
    });

    return NextResponse.json({ url: result.url });
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.message
        : e != null && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : JSON.stringify(e);
    console.error("[upload] imagekit error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
