import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "파일 없음" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "images", "arrival");
    await mkdir(dir, { recursive: true });

    const saved: string[] = [];
    for (const file of files) {
      const filename = path.basename(file.name); // strip any subfolder (webkitdirectory sends relative paths)
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, filename), buffer);
      saved.push(`/images/arrival/${filename}`);
    }

    return NextResponse.json({ saved, count: saved.length });
  } catch (err) {
    console.error("[arrival/images] upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
