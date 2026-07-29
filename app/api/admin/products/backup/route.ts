import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import type { Product } from "@/data/products";

// 상품 데이터에서 참조된 모든 이미지 URL 수집 (중복 제거)
function collectImageUrls(products: Product[]): string[] {
  const urls = new Set<string>();
  for (const p of products) {
    if (p.imageUrl) urls.add(p.imageUrl);
    for (const u of p.subImages ?? []) if (u) urls.add(u);
    for (const b of p.detailBlocks ?? []) if (b.imageUrl) urls.add(b.imageUrl);
    for (const g of p.sizeGuides ?? []) {
      if (g.guideImage) urls.add(g.guideImage);
      if (g.image) urls.add(g.image);
    }
  }
  return Array.from(urls);
}

// URL → ZIP 안 파일명 (마지막 경로 조각 사용, 충돌 시 인덱스 접미사)
function urlToFilename(url: string, index: number, used: Set<string>): string {
  let base = "";
  try {
    base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
  } catch {
    base = "";
  }
  if (!base) base = `image-${index}.jpg`;
  let name = base;
  let n = 1;
  while (used.has(name)) {
    const dot = base.lastIndexOf(".");
    name = dot > 0 ? `${base.slice(0, dot)}-${n}${base.slice(dot)}` : `${base}-${n}`;
    n++;
  }
  used.add(name);
  return name;
}

async function buildZip(products: Product[], urls: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("warning", () => {});
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    archive.append(JSON.stringify(products, null, 2), { name: "products-backup.json" });

    const usedNames = new Set<string>();
    const CONCURRENCY = 8;
    let idx = 0;

    (async () => {
      async function worker() {
        while (idx < urls.length) {
          const i = idx++;
          const url = urls[i];
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            const filename = urlToFilename(url, i, usedNames);
            archive.append(buf, { name: `images/${filename}` });
          } catch {
            // 개별 이미지 다운로드 실패는 건너뜀 (전체 백업은 계속 진행)
          }
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
      archive.finalize();
    })();
  });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").select("*").range(0, 9999);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const products = (data ?? []).map(mapFromDb);
  const urls = collectImageUrls(products);
  const zipBuffer = await buildZip(products, urls);

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="products-backup-${today}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
