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
// 대표(썸네일): "썸네일/"·"대표/" 폴더 → 없으면 루트 이미지        → image_url
// 갤러리(썸네일 스트립): "갤러리/"·"gallery/" 폴더                  → sub_images
// 상세(상세 영역 전용): "상세/"·"detail/" 폴더 + 루트 잔여          → detail_blocks (썸네일엔 안 뜸)
const IMG_RE = /\.(jpe?g|png|webp)$/i;
const THUMB_DIRS = ["썸네일", "대표", "thumb", "thumbnail", "main"];
const DETAIL_DIRS = ["상세", "상세페이지", "detail"];
const GALLERY_DIRS = ["갤러리", "gallery", "sub", "서브"];

function imagesIn(d) {
  if (!d || !fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => IMG_RE.test(f)).sort(natSort).map((f) => path.join(d, f));
}

function collectImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const flat = (names) =>
    entries
      .filter((e) => e.isDirectory() && names.some((n) => e.name.toLowerCase() === n.toLowerCase()))
      .flatMap((e) => imagesIn(path.join(dir, e.name)));
  const thumbFolder = flat(THUMB_DIRS);
  const detailFolder = flat(DETAIL_DIRS);
  const galleryFolder = flat(GALLERY_DIRS);
  const rootImgs = entries.filter((e) => e.isFile() && IMG_RE.test(e.name)).map((e) => path.join(dir, e.name)).sort(natSort);

  // 대표(썸네일): 썸네일폴더 → 루트 → 상세 첫 장
  const thumbPool = thumbFolder.length ? thumbFolder : rootImgs.length ? rootImgs : [...detailFolder, ...galleryFolder];
  const thumb = thumbPool[0] || null;

  // 갤러리(썸네일 스트립): 명시적 "갤러리/" 폴더만 → sub_images
  const gallery = [...new Set(galleryFolder)].filter((p) => p && p !== thumb);

  // 상세(상세 영역 전용): 상세폴더 + 썸네일폴더 잔여 + 루트 잔여 → detail_blocks
  const used = new Set([thumb, ...gallery]);
  const details = [...new Set([...detailFolder, ...thumbFolder, ...rootImgs])].filter((p) => p && !used.has(p));
  return { thumb, gallery, details };
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
  // info.txt 는 선택사항 — 없으면 폴더 이름을 상품명으로 사용
  const infoPath = ["info.txt", "정보.txt"].map((f) => path.join(dir, f)).find((p) => fs.existsSync(p));
  const info = infoPath ? parseInfo(fs.readFileSync(infoPath, "utf8")) : {};
  const get = (...keys) => { for (const k of keys) if (info[k]) return info[k]; return ""; };

  const name = get("상품명", "name", "이름") || folderName.replace(/[-_]+/g, " ").trim();
  const price = get("판매가", "price"); // 선택 — 없으면 빈 값(나중에 관리자에서 입력 가능)
  const id = get("id") || slugify(name);

  // 카테고리: "소품 > 기타" 또는 대/중 분리 입력 모두 지원
  let category = get("대카테고리", "category");
  let subCategory = get("중카테고리", "subCategory");
  const cat = get("카테고리");
  if (cat.includes(">")) { const [a, b] = cat.split(">").map((s) => s.trim()); category = category || a; subCategory = subCategory || b; }
  category = category || "소품"; subCategory = subCategory || "기타";

  // 이미지 수집: 대표→image_url, 갤러리→sub_images(썸네일), 상세→detail_blocks(상세 영역)
  const { thumb, gallery, details } = collectImages(dir);
  if (!thumb && gallery.length === 0 && details.length === 0 && !infoPath) {
    console.log(`  ⚠ ${folderName}: 이미지·정보 없음 → 건너뜀`);
    return false;
  }
  console.log(`  ▶ ${name} (${id}) — 대표:${thumb ? "O" : "X"} 갤러리:${gallery.length}장 상세:${details.length}장`);

  const image_url = thumb ? await uploadImage(thumb, `${id}_thumb`, true) : null;
  const sub_images = [];
  for (let i = 0; i < gallery.length; i++) {
    sub_images.push(await uploadImage(gallery[i], `${id}_gal${i + 1}`, false));
  }
  const detail_blocks = [];
  for (let i = 0; i < details.length; i++) {
    const url = await uploadImage(details[i], `${id}_detail${i + 1}`, false);
    detail_blocks.push({ id: `d${i + 1}`, type: "상품 소개", content: "", imageUrl: url });
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
    image_url, sub_images, detail_blocks,
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
