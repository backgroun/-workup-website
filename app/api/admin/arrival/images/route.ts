import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic    = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "arrival-images";

async function ensureBucket(sb: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.find(b => b.name === BUCKET)) {
    await sb.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "파일 없음" }, { status: 400 });
    }

    const sb = createAdminClient();
    await ensureBucket(sb);

    const saved: string[] = [];

    for (const file of files) {
      const filename = file.name.split("/").pop() ?? file.name; // webkitdirectory는 경로 포함
      const buffer   = Buffer.from(await file.arrayBuffer());

      const { error } = await sb.storage
        .from(BUCKET)
        .upload(filename, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true, // 같은 이름이면 덮어쓰기
        });

      if (error) {
        console.error("[arrival/images] upload error:", filename, error.message);
        continue; // 오류 난 파일은 건너뜀 (다른 파일은 계속 처리)
      }

      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(filename);
      saved.push(urlData.publicUrl);
    }

    return NextResponse.json({ saved, count: saved.length });
  } catch (err) {
    console.error("[arrival/images] route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
