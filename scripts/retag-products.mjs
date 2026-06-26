// ─────────────────────────────────────────────────────────────────────────────
// 더미 제품 카테고리 랜덤 재배정 (일회성)
//
// 관리자에서 카테고리 분류를 새로 등록한 뒤, 기존 제품들의 카테고리 태그가
// 옛 이름이라 새 분류에 안 잡히는 문제를 해결한다.
// DB 의 site_settings(categories) 분류를 읽어 각 제품에 main/sub 를 랜덤 배정한다.
//
// 실행:  node scripts/retag-products.mjs
//   (제품이 더미라 랜덤 배정해도 무방한 경우에만 사용)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── .env.local 로드 ──
const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.log("❌ .env.local 을 찾을 수 없습니다. (Supabase 키 필요)");
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.");
  process.exit(1);
}
const supabase = createClient(url, key);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  // 1) 새 카테고리 분류 로드
  const { data: settings, error: sErr } = await supabase
    .from("site_settings")
    .select("config")
    .eq("section", "categories")
    .maybeSingle();
  if (sErr) { console.log("❌ 카테고리 설정 조회 실패:", sErr.message); process.exit(1); }

  const cats = settings?.config?.categories;
  if (!Array.isArray(cats) || cats.length === 0) {
    console.log("❌ 저장된 카테고리 분류가 없습니다. 먼저 관리자에서 분류를 등록/저장하세요.");
    process.exit(1);
  }
  console.log(`📂 카테고리 ${cats.length}개:`, cats.map((c) => c.name).join(", "));

  // 2) 제품 로드
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, name");
  if (pErr) { console.log("❌ 제품 조회 실패:", pErr.message); process.exit(1); }
  if (!products || products.length === 0) { console.log("ℹ️ 제품이 없습니다."); process.exit(0); }

  console.log(`🛍️ 제품 ${products.length}개 재배정 시작...\n`);

  // 3) 랜덤 배정 + 업데이트
  let ok = 0, fail = 0;
  for (const p of products) {
    const main = pick(cats);
    const sub = main.subs && main.subs.length > 0 ? pick(main.subs) : "";
    const { error: uErr } = await supabase
      .from("products")
      .update({
        category: main.name,
        sub_category: sub,
        categories: [{ main: main.name, sub }],
      })
      .eq("id", p.id);
    if (uErr) { fail++; console.log(`  ✗ ${p.name}: ${uErr.message}`); }
    else { ok++; console.log(`  ✓ ${p.name} → ${main.name}${sub ? " / " + sub : ""}`); }
  }

  console.log(`\n✅ 완료: 성공 ${ok}개, 실패 ${fail}개`);
}

main().catch((e) => { console.error(e); process.exit(1); });
