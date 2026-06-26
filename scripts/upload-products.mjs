// ─────────────────────────────────────────────────────────────────────────────
// 폴더 + 엑셀 기반 상품 자동 등록
//
// [방식 A · 권장] 엑셀로 일괄 등록 (다른 팀에서 받은 정보)
//   products-inbox/ 에 엑셀 1장(상품정보.xlsx) + 상품별 이미지 폴더를 둔다.
//   엑셀의 "폴더명"(없으면 "상품명") 컬럼 = 이미지 폴더 이름으로 매칭.
//     products-inbox/
//       상품정보.xlsx          ← 행 = 상품 (양식: _상품정보_양식.xlsx 참고)
//       스너그 부력보조복/       ← "폴더명" 또는 "상품명"과 일치
//         대표/ (대표컷)  ·  상세/ (상세컷)
//
// [방식 B · 백업] 폴더별 info.txt
//   각 상품 폴더에 info.txt(키:값) + 대표/·상세/ 이미지
//
// 실행:  상품업로드.bat 더블클릭  (또는 node scripts/upload-products.mjs)
//   - 엑셀이 있으면 방식 A, 없으면 방식 B로 자동 동작
//   - "_"로 시작하는 파일/폴더(_양식, _템플릿 등)와 ~$ 임시파일은 무시
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import cloudinaryPkg from "cloudinary";
import sharp from "sharp";
import * as XLSXns from "xlsx";

const XLSX = XLSXns.default && XLSXns.default.utils ? XLSXns.default : XLSXns;
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
const listSplit = (s) => (s ? String(s).split(/[;,]/).map((x) => x.trim()).filter(Boolean) : []);
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

  const thumbPool = thumbFolder.length ? thumbFolder : rootImgs.length ? rootImgs : [...detailFolder, ...galleryFolder];
  const thumb = thumbPool[0] || null;
  const gallery = [...new Set(galleryFolder)].filter((p) => p && p !== thumb);
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
    buf = (meta.width ?? 0) > 1080
      ? await sharp(buf).resize({ width: 1080 }).jpeg({ quality: 85 }).toBuffer()
      : await sharp(buf).jpeg({ quality: 88 }).toBuffer();
  }
  const r = await cloudinary.uploader.upload(`data:image/jpeg;base64,${buf.toString("base64")}`, {
    folder: "workup", public_id: publicId, overwrite: true,
  });
  return r.secure_url;
}

// ── 상품 1건 등록 (info=get 함수, 이미지=imageDir) ──
function buildRow(get, { id, name, image_url, sub_images, detail_blocks }) {
  let category = get("대카테고리", "category");
  let subCategory = get("중카테고리", "subCategory");
  const cat = get("카테고리");
  if (cat.includes(">")) { const [a, b] = cat.split(">").map((s) => s.trim()); category = category || a; subCategory = subCategory || b; }
  category = category || "소품";
  subCategory = subCategory || "기타";
  const colors = listSplit(get("색상", "colors")).map((n) => ({ name: n, hex: COLOR_HEX[n] || "#888888" }));
  const mainExpose = listSplit(get("메인노출", "mainExpose"));
  return {
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
    price: get("판매가", "price") || "",
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
}

async function register(get, name, imageDir) {
  const id = get("id") || slugify(name);
  let image_url = null;
  const sub_images = [];
  const detail_blocks = [];
  if (imageDir && fs.existsSync(imageDir)) {
    const { thumb, gallery, details } = collectImages(imageDir);
    if (thumb) image_url = await uploadImage(thumb, `${id}_thumb`, true);
    for (let i = 0; i < gallery.length; i++) sub_images.push(await uploadImage(gallery[i], `${id}_gal${i + 1}`, false));
    for (let i = 0; i < details.length; i++) {
      detail_blocks.push({ id: `d${i + 1}`, type: "상품 소개", content: "", imageUrl: await uploadImage(details[i], `${id}_detail${i + 1}`, false) });
    }
  }
  const row = buildRow(get, { id, name, image_url, sub_images, detail_blocks });
  const { error } = await sb.from("products").upsert(row, { onConflict: "id" });
  if (error) { console.log(`  ❌ ${name}: ${error.message}`); return false; }
  console.log(`  ✅ ${name} → /products/${id}  (대표:${image_url ? "O" : "X"} 갤러리:${sub_images.length} 상세:${detail_blocks.length})`);
  return true;
}

// ── 방식 A: 엑셀 ──
async function processExcel(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  console.log(`📄 엑셀 「${path.basename(xlsxPath)}」 — ${rows.length}행\n`);
  let ok = 0;
  for (const row of rows) {
    const get = (...keys) => { for (const k of keys) { const v = row[k]; if (v != null && String(v).trim()) return String(v).trim(); } return ""; };
    const name = get("상품명", "name", "이름");
    if (!name) continue;
    const folderName = get("폴더명", "folder") || name;
    const dir = path.join(INBOX, folderName);
    const imageDir = fs.existsSync(dir) ? dir : null;
    if (!imageDir) console.log(`  · ${name}: 이미지 폴더 「${folderName}」 없음 → 정보만 등록`);
    try { if (await register(get, name, imageDir)) ok++; }
    catch (e) { console.log(`  ❌ ${name}: ${e.message}`); }
  }
  console.log(`\n🏁 완료: ${ok}개 등록.\n`);
}

// ── 방식 B: 폴더별 info.txt ──
async function processFolder(dir, folderName) {
  const infoPath = ["info.txt", "정보.txt"].map((f) => path.join(dir, f)).find((p) => fs.existsSync(p));
  const info = infoPath ? parseInfo(fs.readFileSync(infoPath, "utf8")) : {};
  const get = (...keys) => { for (const k of keys) if (info[k]) return String(info[k]).trim(); return ""; };
  const name = get("상품명", "name", "이름") || folderName.replace(/[-_]+/g, " ").trim();
  const { thumb, gallery, details } = collectImages(dir);
  if (!thumb && !gallery.length && !details.length && !infoPath) {
    console.log(`  ⚠ ${folderName}: 이미지·정보 없음 → 건너뜀`);
    return false;
  }
  return register(get, name, dir);
}

// ── 진입점 ──
(async () => {
  if (!fs.existsSync(INBOX)) { console.log("products-inbox 폴더가 없습니다."); return; }

  // 1) 엑셀이 있으면 방식 A
  const excel = fs.readdirSync(INBOX).find(
    (f) => /\.(xlsx|xls|csv)$/i.test(f) && !f.startsWith("_") && !f.startsWith("~$")
  );
  if (excel) { await processExcel(path.join(INBOX, excel)); return; }

  // 2) 없으면 방식 B (폴더별 info.txt)
  const dirs = fs.readdirSync(INBOX, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);
  if (!dirs.length) {
    console.log("📭 등록할 상품이 없습니다. (엑셀 또는 상품 폴더를 products-inbox에 넣으세요)");
    return;
  }
  console.log(`\n📦 상품 폴더 ${dirs.length}개\n`);
  let ok = 0;
  for (const name of dirs) {
    try { if (await processFolder(path.join(INBOX, name), name)) ok++; }
    catch (e) { console.log(`  ❌ ${name}: ${e.message}`); }
  }
  console.log(`\n🏁 완료: ${ok}/${dirs.length}개.\n`);
})();
