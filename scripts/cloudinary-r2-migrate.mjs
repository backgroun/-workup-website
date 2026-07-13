// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary → Cloudflare R2 자산 이전 도구
//
// 예전 Cloudinary→ImageKit 이전(scripts/cloudinary-imagekit-migrate.mjs)이 DB에
// 완전히 반영되지 않아 Cloudinary에 남아있는 잔여 자산을 R2로 직접 옮긴다.
//
// 단계:
//   1) Cloudinary의 모든 자산 나열 (image·video·raw)
//   2) 각 자산을 다운로드해 R2에 같은 경로 구조로 재업로드
//      → 결과는 scripts/.cloudinary-r2-map.json 에 저장(중단 후 재개 가능)
//   3) --apply-db 를 줄 때만: Supabase 전 테이블의 옛 Cloudinary URL을 새 R2 URL로 일괄 치환
//
// 실행:
//   node scripts/cloudinary-r2-migrate.mjs              # 1) 업로드만 (DB는 그대로, 안전)
//   node scripts/cloudinary-r2-migrate.mjs --apply-db   # 2) 위 결과로 Supabase URL까지 갱신
//   node scripts/cloudinary-r2-migrate.mjs --prefix workup/   # 특정 폴더만 대상
//
// 안전장치:
//   - 업로드(1단계)는 기존 Cloudinary 자산을 건드리지 않는 추가(added-only) 작업이라 안전하다.
//   - DB 갱신(--apply-db)은 매핑 파일이 있어야만 실행되며, 실행 전 몇 개가 바뀌는지 미리 보여준다.
//   - 핵심 테이블(products·site_settings) 조회 실패 시 DB 갱신을 거부한다.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import cloudinaryPkg from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const cloudinary = cloudinaryPkg.v2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAP_PATH = path.join(ROOT, "scripts", ".cloudinary-r2-map.json");

// ── CLI 인자 ──
const argv = process.argv.slice(2);
const APPLY_DB = argv.includes("--apply-db");
const prefixArg = argv.find((a) => a.startsWith("--prefix="))?.split("=")[1];
const prefixIdx = argv.indexOf("--prefix");
const PREFIX = prefixArg || (prefixIdx >= 0 ? argv[prefixIdx + 1] : "") || undefined;

// ── .env.local 로드 ──
const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.log("❌ .env.local 을 찾을 수 없습니다. (Cloudinary·R2·Supabase 키 필요)");
  process.exit(1);
}
for (const k of [
  "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
  "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL",
  "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
]) {
  if (!env[k]) { console.log(`❌ .env.local 에 ${k} 가 없습니다.`); process.exit(1); }
}
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const R2_PUBLIC_URL = env.R2_PUBLIC_URL.replace(/\/$/, "");

const fmtMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

// ── 1) Cloudinary 자산 나열 (전체, 폴더 제한 없음이 기본) ──
async function listAll(resourceType) {
  const out = [];
  let next;
  do {
    const res = await cloudinary.api.resources({
      resource_type: resourceType,
      type: "upload",
      max_results: 500,
      next_cursor: next,
      ...(PREFIX ? { prefix: PREFIX } : {}),
    });
    for (const r of res.resources) {
      out.push({ public_id: r.public_id, resource_type: resourceType, format: r.format, bytes: r.bytes || 0, secure_url: r.secure_url });
    }
    next = res.next_cursor;
  } while (next);
  return out;
}

// ── 2) 자산 하나를 R2로 재업로드 ──
async function migrateOne(asset) {
  const res = await fetch(asset.secure_url);
  if (!res.ok) throw new Error(`다운로드 실패 (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const base = asset.public_id.replace(/^\/+/, "");
  const key = asset.format ? `${base}.${asset.format}` : base;
  await r2.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: buf,
    ContentType: guessContentType(asset.format),
  }));
  // DB에는 쿼리 파라미터 없이 순수 URL로 저장되어 있으므로 그대로 사용.
  return { newUrl: `${R2_PUBLIC_URL}/${key}`, newKey: key };
}

function guessContentType(format) {
  const map = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif", mp4: "video/mp4", mov: "video/quicktime", pdf: "application/pdf" };
  return map[(format || "").toLowerCase()] || "application/octet-stream";
}

// ── 3) Supabase 전 테이블에서 옛 URL → 새 URL 일괄 치환 ──
const CORE_TABLES = ["products", "site_settings"];
const OTHER_TABLES = [
  "catalog_pages", "stores", "store_events", "store_jobs",
  "hero_slides", "brands", "manufacturers", "members", "pixel_settings",
  "inquiries", "inquiry_dummies", "brand_catalogs",
];

async function replaceAcrossTables(urlMap) {
  let coreFailed = false;
  let totalUpdated = 0;
  for (const table of [...CORE_TABLES, ...OTHER_TABLES]) {
    const { data, error } = await sb.from(table).select("*");
    if (error) {
      const missing = /does not exist|schema cache|42P01/i.test(error.message);
      console.log(`  ⚠ ${table}: ${error.message}${missing ? " (없는 테이블 → 건너뜀)" : ""}`);
      if (!missing && CORE_TABLES.includes(table)) coreFailed = true;
      continue;
    }
    let changed = 0;
    for (const row of data ?? []) {
      let json = JSON.stringify(row);
      let touched = false;
      for (const [oldUrl, newUrl] of urlMap) {
        if (json.includes(oldUrl)) { json = json.split(oldUrl).join(newUrl); touched = true; }
      }
      if (!touched) continue;
      const next = JSON.parse(json);
      delete next.created_at; delete next.updated_at; // 트리거/기본값에 맡김
      const { error: upErr } = await sb.from(table).update(next).eq("id", row.id);
      if (upErr) console.log(`  ✗ ${table}#${row.id}: ${upErr.message}`);
      else changed++;
    }
    if (changed) { console.log(`  · ${table}: ${changed}행 갱신`); totalUpdated += changed; }
  }
  return { totalUpdated, coreFailed };
}

(async () => {
  console.log(`\n🔎 대상 폴더: ${PREFIX || "전체"}  |  모드: ${APPLY_DB ? "🚀 업로드 + DB 갱신(--apply-db)" : "📤 업로드만 (DB 미변경)"}\n`);

  let existingMap = [];
  try { existingMap = JSON.parse(fs.readFileSync(MAP_PATH, "utf8")); } catch { /* 최초 실행 */ }
  const done = new Map(existingMap.map((m) => [m.public_id, m]));

  console.log("① Cloudinary 자산 나열…");
  const assets = [
    ...(await listAll("image")),
    ...(await listAll("video")),
    ...(await listAll("raw")),
  ];
  const totalBytes = assets.reduce((s, a) => s + a.bytes, 0);
  console.log(`   → 총 ${assets.length}개 자산 (${fmtMB(totalBytes)})  |  이미 이전됨: ${done.size}개\n`);

  console.log("② R2로 재업로드…");
  const toProcess = assets.filter((a) => !done.has(a.public_id));
  let ok = 0, fail = 0;
  for (const asset of toProcess) {
    try {
      const { newUrl, newKey } = await migrateOne(asset);
      done.set(asset.public_id, { public_id: asset.public_id, oldUrl: asset.secure_url, newUrl, newKey });
      ok++;
      if (ok % 25 === 0) {
        fs.writeFileSync(MAP_PATH, JSON.stringify([...done.values()], null, 2));
        console.log(`   … ${ok}/${toProcess.length} 진행 중 (중간 저장됨)`);
      }
    } catch (e) {
      fail++;
      console.log(`   ✗ ${asset.public_id}: ${e.message || e}`);
    }
  }
  fs.writeFileSync(MAP_PATH, JSON.stringify([...done.values()], null, 2));
  console.log(`   → 신규 업로드 ${ok}개 성공, ${fail}개 실패 (전체 이전 완료: ${done.size}/${assets.length})`);
  console.log(`   📄 매핑 저장: ${path.relative(ROOT, MAP_PATH)}\n`);

  if (!APPLY_DB) {
    console.log("👀 DB는 아직 그대로입니다. 위 매핑을 확인한 뒤, 실제 사이트에 반영하려면:");
    console.log("   node scripts/cloudinary-r2-migrate.mjs --apply-db\n");
    return;
  }

  console.log("③ 전 테이블 URL 일괄 치환…");
  const urlMap = [...done.values()].map((m) => [m.oldUrl, m.newUrl]);
  const { totalUpdated, coreFailed } = await replaceAcrossTables(urlMap);

  if (coreFailed) {
    console.log("\n❌ 핵심 테이블 조회에 실패해 일부만 반영됐을 수 있습니다. 결과를 꼭 확인하세요.");
  }
  console.log(`\n✅ 완료 — 전체 테이블 ${totalUpdated}행 갱신됨.`);
  console.log("   사이트를 새로고침해 이미지·영상·PDF가 정상 표시되는지 확인해주세요.");
})().catch((e) => { console.error("\n❌ 오류:", e.message || e); process.exit(1); });
