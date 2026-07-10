// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary 미사용 이미지 정리 도구
//
// workup/ 폴더에 올라가 있지만 사이트 어디에서도 참조되지 않는 자산(이미지·PDF·영상)을
// 찾아서 정리한다. "사용 중" 판단은 Supabase 전 테이블을 훑어 결정하므로,
// 관리자에서 등록한 동적 이미지도 안전하게 보존한다.
//
// 동작:
//   1) Cloudinary workup/ 폴더의 모든 자산 나열 (image·video·raw, 페이지네이션)
//   2) Supabase 전 테이블에서 참조되는 public_id 를 전부 수집
//   3) 참조되지 않는 자산 = 미사용 → 리포트 출력 + scripts/.cloudinary-unused.json 저장
//
// 실행:
//   node scripts/cloudinary-cleanup.mjs            # DRY-RUN (조회만, 삭제 안 함) ← 먼저 이걸로 확인
//   node scripts/cloudinary-cleanup.mjs --delete   # 실제 삭제 (되돌릴 수 없음)
//   node scripts/cloudinary-cleanup.mjs --prefix workup/brands   # 특정 폴더만 대상
//
// 안전장치:
//   - 기본은 DRY-RUN. --delete 없이는 절대 지우지 않는다.
//   - workup/ 밖의 자산은 대상에서 제외한다(다른 프로젝트 보호).
//   - 핵심 테이블(products·brand_catalogs·site_settings) 조회가 실패하면 삭제를 거부한다.
//     (참조 목록이 불완전한 상태로 지우면 사용 중 이미지를 삭제할 위험이 있으므로)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import cloudinaryPkg from "cloudinary";

const cloudinary = cloudinaryPkg.v2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── CLI 인자 ──
const argv = process.argv.slice(2);
const DELETE = argv.includes("--delete");
const prefixArg = argv.find((a) => a.startsWith("--prefix="))?.split("=")[1];
const prefixIdx = argv.indexOf("--prefix");
const PREFIX = (prefixArg || (prefixIdx >= 0 ? argv[prefixIdx + 1] : "") || "workup/").replace(/\/?$/, "/");

// ── .env.local 로드 ──
const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.log("❌ .env.local 을 찾을 수 없습니다. (Cloudinary·Supabase 키 필요)");
  process.exit(1);
}
for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!env[k]) { console.log(`❌ .env.local 에 ${k} 가 없습니다.`); process.exit(1); }
}
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── 1) Cloudinary 자산 나열 (resource_type 별로 prefix 페이지네이션) ──
async function listAll(resourceType) {
  const out = [];
  let next;
  do {
    const res = await cloudinary.api.resources({
      resource_type: resourceType,
      type: "upload",
      prefix: PREFIX,
      max_results: 500,
      next_cursor: next,
    });
    for (const r of res.resources) {
      // prefix 는 부분일치이므로 "workup/" 하위만 정확히 남긴다.
      if (r.public_id.startsWith(PREFIX)) {
        out.push({ public_id: r.public_id, resource_type: resourceType, bytes: r.bytes || 0, created_at: r.created_at });
      }
    }
    next = res.next_cursor;
  } while (next);
  return out;
}

// ── 2) Supabase 전 테이블에서 참조 문자열(haystack) 수집 ──
// public_id 는 URL·직접 필드 어디에 있든 문자열로 그대로 등장하므로,
// 각 자산의 public_id 가 이 거대 문자열에 포함되는지로 "사용 중"을 판정한다.
const CORE_TABLES = ["products", "brand_catalogs", "site_settings"];
const OTHER_TABLES = [
  "catalog_pages", "stores", "store_events", "store_jobs",
  "hero_slides", "brands", "manufacturers", "members", "pixel_settings",
  "inquiries", "inquiry_dummies",
];

async function collectHaystack() {
  const parts = [];
  const warnings = [];
  let coreFailed = false;

  for (const table of [...CORE_TABLES, ...OTHER_TABLES]) {
    const { data, error } = await sb.from(table).select("*");
    if (error) {
      const missing = /does not exist|schema cache|42P01/i.test(error.message);
      warnings.push(`  ⚠ ${table}: ${error.message}${missing ? " (없는 테이블 → 건너뜀)" : ""}`);
      if (!missing && CORE_TABLES.includes(table)) coreFailed = true;
      continue;
    }
    parts.push(JSON.stringify(data ?? []));
    console.log(`  · ${table}: ${data?.length ?? 0}행 스캔`);
  }
  return { haystack: parts.join("\n"), warnings, coreFailed };
}

const fmtMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

(async () => {
  console.log(`\n🔎 대상 폴더: ${PREFIX}  |  모드: ${DELETE ? "🗑️  삭제(--delete)" : "👀 DRY-RUN(조회만)"}\n`);

  console.log("① Cloudinary 자산 나열…");
  const assets = [
    ...(await listAll("image")),
    ...(await listAll("video")),
    ...(await listAll("raw")),
  ];
  console.log(`   → 총 ${assets.length}개 자산\n`);

  console.log("② Supabase 참조 수집…");
  const { haystack, warnings, coreFailed } = await collectHaystack();
  if (warnings.length) { console.log("\n" + warnings.join("\n")); }

  if (haystack.length < 50) {
    console.log("\n❌ 참조 데이터가 비정상적으로 적습니다. 안전을 위해 중단합니다. (.env.local·DB 연결 확인)");
    process.exit(1);
  }

  // ── 3) 미사용 판정 ──
  const unused = assets.filter((a) => !haystack.includes(a.public_id));
  const usedCount = assets.length - unused.length;
  const reclaim = unused.reduce((s, a) => s + a.bytes, 0);

  console.log(`\n③ 결과 — 사용 중 ${usedCount}개 / 미사용 ${unused.length}개  (회수 가능 ${fmtMB(reclaim)})\n`);

  if (unused.length) {
    for (const a of unused.sort((x, y) => y.bytes - x.bytes)) {
      console.log(`   ✗ ${a.public_id}  [${a.resource_type}, ${fmtMB(a.bytes)}]`);
    }
    const reportPath = path.join(ROOT, "scripts", ".cloudinary-unused.json");
    fs.writeFileSync(reportPath, JSON.stringify(unused, null, 2));
    console.log(`\n   📄 상세 리포트: ${path.relative(ROOT, reportPath)}`);
  } else {
    console.log("   ✅ 미사용 자산이 없습니다. 깨끗합니다.");
  }

  // ── 4) 삭제 ──
  if (!DELETE) {
    if (unused.length) {
      console.log(`\n👀 DRY-RUN 이라 아무것도 지우지 않았습니다.`);
      console.log(`   위 목록을 확인한 뒤, 실제로 지우려면:  node scripts/cloudinary-cleanup.mjs --delete`);
    }
    return;
  }

  if (coreFailed) {
    console.log("\n❌ 핵심 테이블 조회에 실패해 참조 목록이 불완전합니다. 사용 중 이미지를 지울 위험이 있어 삭제를 거부합니다.");
    process.exit(1);
  }
  if (!unused.length) return;

  console.log(`\n🗑️  ${unused.length}개 삭제 중…`);
  let done = 0;
  for (const type of ["image", "video", "raw"]) {
    const ids = unused.filter((a) => a.resource_type === type).map((a) => a.public_id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      await cloudinary.api.delete_resources(batch, { resource_type: type, type: "upload" });
      done += batch.length;
      console.log(`   … ${done}/${unused.length}`);
    }
  }
  console.log(`\n✅ 삭제 완료: ${done}개 (${fmtMB(reclaim)} 회수)`);
})().catch((e) => { console.error("\n❌ 오류:", e.message || e); process.exit(1); });
