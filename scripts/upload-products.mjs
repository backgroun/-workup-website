// ─────────────────────────────────────────────────────────────────────────────
// 폴더 기반 상품 자동 등록 스크립트
//   products-inbox/<상품폴더>/ 안의 info.txt + 이미지들을 읽어
//   이미지 → Cloudinary 업로드, 상품정보 → Supabase 등록(upsert).
//
// 실행:  node scripts/upload-products.mjs   (또는 상품업로드.bat 더블클릭)
//
// 폴더 규칙:
//   썸네일.jpg / thumb*  → 대표 이미지(960×930로 자동 정리)
//   상세*, 그 외 이미지   → 상세(추가) 이미지, 파일명 순서대로
//   info.txt             → "키: 값" 형식 (한글 키 지원)
//   "_"로 시작하는 폴더는 건너뜀(_사용법, _템플릿 등)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import cloudinaryPkg from "cloudinary";
import sharp from "sharp";

const cloudinary = cloudinaryPkg.v2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INBOX = path.join(ROOT, "products-inbox");

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
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── 유틸 ──
const COLOR_HEX = {
  그레이: "#5b5f63", 차콜그린: "#4a5247", 블랙: "#1c1c1c", 네이비: "#1a2b4a",
  화이트: "#f0f0f0", 카키: "#4a5240", 베이지: "#c9b99a", 올리브: "#556b2f",
};
const slugify = (name) =>
  name.toLowerCase().replace(/[^\w\s가-힣]/g, "").replace(/\s+/g, "-").replace(/[가-힣]/g, (c) => c.charCodeAt(0).toString(16));
const listSplit = (s) => (s ? s.split(/[;,]/).map((x) => x.trim()).filter(Boolean) : []);
const natSort = (a, b) => a.localeCompare(b, undefined, { numeric: true });

function parseInfo(txt) {
  const o = {};
  for (const line of txt.split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([^:：]+)\s*[:：]\s*(.*)$/);
    if (m) o[m[1].trim()] = m[2].trim();
  }
  return o;
}

// ── 이미지 수집 ──
// 우선순위: "썸네일/" · "상세/" 하위폴더(파일명 무관) → 없으면 루트 파일명으로 분류
const IMG_RE = /\.(jpe?g|png|webp)$/i;
const THUMB_DIRS = ["썸네일", "대표", "thumb", "thumbnail", "main"];
const DETAIL_DIRS = ["상세", "상세페이지", "detail", "갤러리", "gallery"];

function imagesIn(d) {
  if (!d || !fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => IMG_RE.test(f)).sort(natSort).map((f) => path.join(d, f));
}

function collectImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const findDir = (names) => {
    const e = entries.find((en) => en.isDirectory() && names.some((n) => en.name.toLowerCase() === n.toLowerCase()));
    return e ? path.join(dir, e.name) : null;
  };
  const thumbDir = findDir(THUMB_DIRS);
  const detailDir = findDir(DETAIL_DIRS);
  let thumbs = imagesIn(thumbDir);
  let details = imagesIn(detailDir);

  const rootImgs = entries.filter((e) => e.isFile() && IMG_RE.test(e.name)).map((e) => e.name).sort(natSort);
  if (!thumbDir && !detailDir) {
    // 하위폴더 없음 → 루트 파일명으로 분류(이전 방식 호환)
    const tf = rootImgs.find((f) => /썸네일|thumb|대표|main/i.test(f)) || rootImgs[0];
    if (tf) { thumbs = [path.join(dir, tf)]; details = rootImgs.filter((f) => f !== tf).map((f) => path.join(dir, f)); }
  } else {
    // 하위폴더 사용 — 루트에 흩어진 이미지는 상세로 추가
    details = [...details, ...rootImgs.map((f) => path.join(dir, f))];
  }
  const thumb = thumbs[0] || null;
  if (thumbs.length > 1) details = [...thumbs.slice(1), ...details]; // 썸네일 폴더에 여러 장이면 첫 장만 대표
  return { thumb, details };
}

async function uploadImage(filePath, publicId, isThumb) {
  let buf = fs.readFileSync(filePath);
  if (isThumb) {
    buf = await sharp(buf).resize(960, 930, { fit: "contain", background: { r: 237, g: 237, b: 237 } }).jpeg({ quality: 88 }).toBuffer();
  } else {
    const meta = await sharp(buf).metadata();
    if ((meta.width ?? 0) > 1080) buf = await sharp(buf).resize({ width: 1080 }).jpeg({ quality: 85 }).toBuffer();
    else buf = await sharp(buf).jpeg({ quality: 88 }).toBuffer();
  }
  const r = await cloudinary.uploader.upload(`data:image/jpeg;base64,${buf.toString("base64")}`, {
    folder: "workup", public_id: publicId, overwrite: true,
  });
  return r.secure_url;
}

async function processFolder(dir, folderName) {
  const infoPath = ["info.txt", "정보.txt"].map((f) => path.join(dir, f)).find((p) => fs.existsSync(p));
  if (!infoPath) { console.log(`  ⚠ ${folderName}: info.txt 없음 → 건너뜀`); return false; }
  const info = parseInfo(fs.readFileSync(infoPath, "utf8"));
  const get = (...keys) => { for (const k of keys) if (info[k]) return info[k]; return ""; };

  const name = get("상품명", "name", "이름");
  const price = get("판매가", "price");
  if (!name) { console.log(`  ⚠ ${folderName}: 상품명 없음 → 건너뜀`); return false; }
  if (!price) { console.log(`  ⚠ ${name}: 판매가 없음 → 건너뜀`); return false; }
  const id = get("id") || slugify(name);

  // 카테고리: "소품 > 기타" 또는 대/중 분리 입력 모두 지원
  let category = get("대카테고리", "category");
  let subCategory = get("중카테고리", "subCategory");
  const cat = get("카테고리");
  if (cat.includes(">")) { const [a, b] = cat.split(">").map((s) => s.trim()); category = category || a; subCategory = subCategory || b; }
  category = category || "소품"; subCategory = subCategory || "기타";

  // 이미지 수집 (썸네일/ · 상세/ 하위폴더 우선, 없으면 루트 파일명으로 분류)
  const { thumb, details } = collectImages(dir);
  console.log(`  ▶ ${name} (${id}) — 썸네일:${thumb ? "O" : "X"} 상세:${details.length}장`);

  const image_url = thumb ? await uploadImage(thumb, `${id}_thumb`, true) : null;
  const sub_images = [];
  for (let i = 0; i < details.length; i++) {
    sub_images.push(await uploadImage(details[i], `${id}_img${i + 1}`, false));
  }

  const colors = listSplit(get("색상", "colors")).map((n) => ({ name: n, hex: COLOR_HEX[n] || "#888888" }));
  const mainExpose = listSplit(get("메인노출", "mainExpose"));

  const row = {
    id, name,
    sku: get("상품코드", "sku") || null,
    brand: get("브랜드", "brand") || null,
    manufacturer: get("제조사", "manufacturer") || null,
    origin: get("원산지", "origin") || null,
    line: get("라인", "line") || "DAILY",
    category, sub_category: subCategory,
    categories: [{ main: category, sub: subCategory }],
    status: get("판매상태", "status") || "판매중",
    is_new: mainExpose.includes("신상품"),
    tagline: get("한줄소개", "tagline") || "",
    price,
    consumer_price: get("소비자가", "consumerPrice") || null,
    supply_price: get("공급가", "supplyPrice") || null,
    features: listSplit(get("주요특징", "features")),
    feature_tags: listSplit(get("기능태그", "featureTags")),
    job_sites: listSplit(get("현장추천", "jobSites")),
    seasons: listSplit(get("시즌", "seasons")),
    main_expose: mainExpose,
    bg: "bg-[#1A2B4A]",
    colors,
    sizes: listSplit(get("사이즈", "sizes")),
    image_url, sub_images, detail_blocks: [],
    meta_title: get("메타타이틀", "metaTitle") || `${name} | WORKUP`,
    meta_desc: get("메타설명", "metaDesc") || get("한줄소개", "tagline") || null,
  };

  const { error } = await sb.from("products").upsert(row, { onConflict: "id" });
  if (error) { console.log(`  ❌ ${name}: 등록 실패 — ${error.message}`); return false; }
  console.log(`  ✅ ${name}: 등록 완료 → /products/${id}`);
  return true;
}

(async () => {
  if (!fs.existsSync(INBOX)) { console.log("products-inbox 폴더가 없습니다."); return; }
  const dirs = fs.readdirSync(INBOX, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);
  if (!dirs.length) { console.log("📭 등록할 상품 폴더가 없습니다. products-inbox/ 안에 상품 폴더를 넣으세요."); return; }
  console.log(`\n📦 상품 폴더 ${dirs.length}개 발견\n`);
  let ok = 0;
  for (const name of dirs) {
    try { if (await processFolder(path.join(INBOX, name), name)) ok++; }
    catch (e) { console.log(`  ❌ ${name}: ${e.message}`); }
  }
  console.log(`\n🏁 완료: ${ok}/${dirs.length}개 등록.\n`);
})();
