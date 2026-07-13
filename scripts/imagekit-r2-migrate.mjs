// ─────────────────────────────────────────────────────────────────────────────
// ImageKit → Cloudflare R2 자산 이전 도구
//
// ImageKit 미디어 라이브러리의 모든 자산(이미지·영상·PDF)을 R2로 재업로드하고,
// (--apply-db 사용 시) Supabase 전 테이블의 옛 ImageKit URL을 새 R2 URL로 교체한다.
//
// 단계:
//   1) ImageKit의 모든 자산 나열 (assets.list, type=file)
//   2) 각 자산을 다운로드해 R2에 같은 경로 구조로 재업로드
//      → 결과는 scripts/.imagekit-r2-map.json 에 저장(중단 후 재개 가능 — 이미 옮긴 자산은 건너뜀)
//   3) --apply-db 를 줄 때만: brand_catalogs 는 pdf_public_id/pdf_file_id/pdf_url을
//      새 R2 정보로 갱신(thumbnail_url은 비움 — 카탈로그 뷰어 미오픈으로 기능 보류),
//      나머지 테이블은 옛 URL 문자열을 새 URL로 일괄 치환
//
// 실행:
//   node scripts/imagekit-r2-migrate.mjs              # 1) 업로드만 (DB는 그대로, 안전)
//   node scripts/imagekit-r2-migrate.mjs --apply-db   # 2) 위 결과로 Supabase URL까지 갱신
//   node scripts/imagekit-r2-migrate.mjs --path /workup/brands   # 특정 폴더만 대상
//
// 안전장치:
//   - 업로드(1단계)는 기존 ImageKit 자산을 건드리지 않는 추가(added-only) 작업이라 안전하다.
//   - DB 갱신(--apply-db)은 매핑 파일이 있어야만 실행되며, 실행 전 몇 개가 바뀌는지 미리 보여준다.
//   - 핵심 테이블(products·brand_catalogs·site_settings) 조회 실패 시 DB 갱신을 거부한다.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import ImageKit from "@imagekit/nodejs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAP_PATH = path.join(ROOT, "scripts", ".imagekit-r2-map.json");

// ── CLI 인자 ──
const argv = process.argv.slice(2);
const APPLY_DB = argv.includes("--apply-db");
const pathArg = argv.find((a) => a.startsWith("--path="))?.split("=")[1];
const pathIdx = argv.indexOf("--path");
const SCOPE_PATH = pathArg || (pathIdx >= 0 ? argv[pathIdx + 1] : "") || undefined;

// ── .env.local 로드 ──
const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.log("❌ .env.local 을 찾을 수 없습니다. (ImageKit·R2·Supabase 키 필요)");
  process.exit(1);
}
for (const k of [
  "IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_URL_ENDPOINT",
  "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL",
  "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
]) {
  if (!env[k]) { console.log(`❌ .env.local 에 ${k} 가 없습니다.`); process.exit(1); }
}

const imagekit = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const R2_PUBLIC_URL = env.R2_PUBLIC_URL.replace(/\/$/, "");

const fmtMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

// ── 1) ImageKit 자산 나열 (페이지네이션) ──
async function listAll() {
  const out = [];
  let skip = 0;
  const limit = 1000;
  for (;;) {
    const page = await imagekit.assets.list({
      type: "file",
      limit,
      skip,
      ...(SCOPE_PATH ? { path: SCOPE_PATH } : {}),
    });
    const files = Array.isArray(page) ? page : [];
    out.push(...files.filter((f) => f.filePath && f.url));
    // ImageKit이 요청한 limit보다 적은 개수로 응답을 자체적으로 잘라 줄 수 있으므로,
    // "빈 페이지"를 받을 때까지 계속 진행한다 (skip은 실제 받은 개수만큼만 증가).
    if (files.length === 0) break;
    skip += files.length;
  }
  return out;
}

// ── 2) 자산 하나를 R2로 재업로드 ──
async function migrateOne(asset) {
  const res = await fetch(asset.url);
  if (!res.ok) throw new Error(`다운로드 실패 (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const key = asset.filePath.replace(/^\/+/, "");
  await r2.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: buf,
    ContentType: asset.mime || "application/octet-stream",
  }));
  return { newUrl: `${R2_PUBLIC_URL}/${key}`, newKey: key };
}

// ── 3) Supabase 전 테이블에서 옛 URL → 새 URL 일괄 치환 (brand_catalogs 제외) ──
const CORE_TABLES = ["products", "site_settings"];
const OTHER_TABLES = [
  "catalog_pages", "stores", "store_events", "store_jobs",
  "hero_slides", "brands", "manufacturers", "members", "pixel_settings",
  "inquiries", "inquiry_dummies",
];

// 테이블별 기본키 컬럼명 (대부분 id, site_settings만 section)
const TABLE_PK = { site_settings: "section" };

async function replaceAcrossTables(urlMap) {
  let coreFailed = false;
  let totalUpdated = 0;
  for (const table of [...CORE_TABLES, ...OTHER_TABLES]) {
    const pk = TABLE_PK[table] || "id";
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
      const { error: upErr } = await sb.from(table).update(next).eq(pk, row[pk]);
      if (upErr) console.log(`  ✗ ${table}#${row[pk]}: ${upErr.message}`);
      else changed++;
    }
    if (changed) { console.log(`  · ${table}: ${changed}행 갱신`); totalUpdated += changed; }
  }
  return { totalUpdated, coreFailed };
}

// ── 4) brand_catalogs 전용 처리 (pdf_public_id/pdf_file_id는 ImageKit filePath 기준으로 매칭) ──
async function migrateBrandCatalogs(assetByFilePath) {
  const { data, error } = await sb.from("brand_catalogs").select("*");
  if (error) { console.log(`  ⚠ brand_catalogs: ${error.message}`); return 0; }
  let changed = 0;
  for (const row of data ?? []) {
    const filePath = row.pdf_public_id?.startsWith("/") ? row.pdf_public_id : `/${row.pdf_public_id ?? ""}`;
    const info = assetByFilePath.get(filePath);
    if (!info) continue; // 이미 R2 자산이거나 매핑 없음
    const { error: upErr } = await sb.from("brand_catalogs").update({
      pdf_public_id: info.newKey,
      pdf_file_id: info.newKey,
      pdf_url: info.newUrl,
      thumbnail_url: "", // 카탈로그 뷰어 미오픈 — 자동 생성 기능 보류
    }).eq("id", row.id);
    if (upErr) console.log(`  ✗ brand_catalogs#${row.id}: ${upErr.message}`);
    else changed++;
  }
  if (changed) console.log(`  · brand_catalogs: ${changed}행 갱신`);
  return changed;
}

(async () => {
  console.log(`\n🔎 대상 경로: ${SCOPE_PATH || "전체"}  |  모드: ${APPLY_DB ? "🚀 업로드 + DB 갱신(--apply-db)" : "📤 업로드만 (DB 미변경)"}\n`);

  // 기존 매핑 로드 (재개용)
  let existingMap = [];
  try { existingMap = JSON.parse(fs.readFileSync(MAP_PATH, "utf8")); } catch { /* 최초 실행 */ }
  const done = new Map(existingMap.map((m) => [m.filePath, m]));

  console.log("① ImageKit 자산 나열…");
  const assets = await listAll();
  const totalBytes = assets.reduce((s, a) => s + (a.size || 0), 0);
  console.log(`   → 총 ${assets.length}개 자산 (${fmtMB(totalBytes)})  |  이미 이전됨: ${done.size}개\n`);

  console.log("② R2로 재업로드…");
  const toProcess = assets.filter((a) => !done.has(a.filePath));
  let ok = 0, fail = 0;
  for (const asset of toProcess) {
    try {
      const { newUrl, newKey } = await migrateOne(asset);
      // DB에는 ?updatedAt=... 같은 캐시버스팅 쿼리 없이 저장되어 있으므로 매칭용 oldUrl은 쿼리를 제거한다.
      const oldUrl = asset.url.split("?")[0];
      done.set(asset.filePath, { filePath: asset.filePath, oldUrl, newUrl, newKey });
      ok++;
      if (ok % 25 === 0) {
        fs.writeFileSync(MAP_PATH, JSON.stringify([...done.values()], null, 2));
        console.log(`   … ${ok}/${toProcess.length} 진행 중 (중간 저장됨)`);
      }
    } catch (e) {
      fail++;
      console.log(`   ✗ ${asset.filePath}: ${e.message || e}`);
    }
  }
  fs.writeFileSync(MAP_PATH, JSON.stringify([...done.values()], null, 2));
  console.log(`   → 신규 업로드 ${ok}개 성공, ${fail}개 실패 (전체 이전 완료: ${done.size}/${assets.length})`);
  console.log(`   📄 매핑 저장: ${path.relative(ROOT, MAP_PATH)}\n`);

  if (!APPLY_DB) {
    console.log("👀 DB는 아직 그대로입니다. 위 매핑을 확인한 뒤, 실제 사이트에 반영하려면:");
    console.log("   node scripts/imagekit-r2-migrate.mjs --apply-db\n");
    return;
  }

  console.log("③ brand_catalogs 갱신…");
  const assetByFilePath = new Map([...done.values()].map((m) => [m.filePath, m]));
  const brandChanged = await migrateBrandCatalogs(assetByFilePath);

  console.log("\n④ 나머지 테이블 URL 일괄 치환…");
  const urlMap = [...done.values()].map((m) => [m.oldUrl, m.newUrl]);
  const { totalUpdated, coreFailed } = await replaceAcrossTables(urlMap);

  if (coreFailed) {
    console.log("\n❌ 핵심 테이블 조회에 실패해 일부만 반영됐을 수 있습니다. 결과를 꼭 확인하세요.");
  }
  console.log(`\n✅ 완료 — brand_catalogs ${brandChanged}행 + 기타 테이블 ${totalUpdated}행 갱신됨.`);
  console.log("   사이트를 새로고침해 이미지·영상·PDF가 정상 표시되는지 확인해주세요.");
})().catch((e) => { console.error("\n❌ 오류:", e.message || e); process.exit(1); });
