import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getR2UploadUrl, uniqueKey } from "@/lib/r2-server";

// 브라우저 → R2 직접 업로드용 presigned URL 발급.
// 대용량 PDF·동영상이 Vercel 프록시(~4.5MB)를 우회해 바로 R2로 올라가도록 한다.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const folder = typeof body?.folder === "string" && body.folder ? body.folder : "workup";
  const fileName = typeof body?.fileName === "string" && body.fileName ? body.fileName : "upload";
  const contentType = typeof body?.contentType === "string" && body.contentType ? body.contentType : "application/octet-stream";

  const key = uniqueKey(folder, fileName);
  const { uploadUrl, publicUrl } = await getR2UploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
