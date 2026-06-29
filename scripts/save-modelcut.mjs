// ─────────────────────────────────────────────────────────────────────────────
// 모델컷 자동 저장 (반신 + 전신 × 원본 + 960, 전부 투명)
//
// 발끝까지 전신으로 생성 후 배경 제거한 "투명 컷아웃" 한 장을 넣으면,
// 반신/전신 × 원본/960 = 4종 투명 PNG를 생성해 generated/<제품ID>/ 에 자동 저장한다.
//   - full_2048.png : 전신 투명 원본 (입력 그대로)
//   - full_960.png  : 전신 960 투명 프레이밍
//   - half_2048.png : 반신 투명 원본 (손 아래선까지 세로 크롭)
//   - half_960.png  : 반신 960 투명 프레이밍 (베스트 큼 + 양손)
//
// 저장 위치: D:\WORK_DATA\2026_workup_website\generated\<제품ID>\  (.gitignore 처리됨)
//
// 실행:  node scripts/save-modelcut.mjs <제품ID> <전신컷아웃.png> [반신크롭비율=0.58]
// ─────────────────────────────────────────────────────────────────────────────
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PRODUCT_ID = process.argv[2];
const SRC = process.argv[3];
const HALF_RATIO = parseFloat(process.argv[4] || "0.58"); // 반신: 발끝전신 높이의 ~0.58 (손 아래선)

if (!PRODUCT_ID || !SRC) {
  console.error("사용법: node scripts/save-modelcut.mjs <제품ID> <전신컷아웃.png> [반신크롭비율=0.58]");
  process.exit(1);
}
if (!fs.existsSync(SRC)) {
  console.error("입력 파일 없음:", SRC);
  process.exit(1);
}

const dest = path.join(ROOT, "generated", PRODUCT_ID);
fs.mkdirSync(dest, { recursive: true });

const SIZE = parseInt(process.env.THUMB_SIZE || "1600", 10); // 출력 캔버스(기본 1600)

const frameScript = path.join(ROOT, "scripts", "thumbnail-frame.mjs");
const frame = (input, output) =>
  execFileSync("node", [frameScript, input, output, "width", "transparent"], {
    stdio: "inherit",
    env: { ...process.env, THUMB_SIZE: String(SIZE) },
  });

const fullOrig = path.join(dest, "full_src.png"); // 전신 고해상도 원본 (반신 크롭용)
const fullOut = path.join(dest, `full_${SIZE}.png`);
const halfOrig = path.join(dest, "half_src.png");
const halfOut = path.join(dest, `half_${SIZE}.png`);

// 1) 전신 원본 (입력 복사)
fs.copyFileSync(SRC, fullOrig);

// 2) 반신 원본 (손 아래선까지 세로 크롭)
const meta = await sharp(SRC).metadata();
const keep = Math.round(meta.height * HALF_RATIO);
await sharp(SRC).extract({ left: 0, top: 0, width: meta.width, height: keep }).png().toFile(halfOrig);

// 3) 전신 / 반신 프레이밍 (투명, SIZE×SIZE)
frame(fullOrig, fullOut);
frame(halfOrig, halfOut);

console.log("\n저장 완료 →", dest);
for (const f of [fullOrig, fullOut, halfOrig, halfOut]) {
  console.log("  -", path.basename(f));
}
