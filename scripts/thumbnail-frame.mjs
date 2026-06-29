// ─────────────────────────────────────────────────────────────────────────────
// 모델컷 썸네일 프레이밍 (960×960 · 배경 #EDEDED)
//
// 배경이 제거된 모델 컷아웃(투명 PNG)을 받아, 카탈로그 규격으로 정규화한다.
// AI 모델컷 생성 → 배경 제거(누끼) → [이 스크립트] 순서로 사용한다.
//
// 프레이밍 규칙 (가이드: 상23/하18/좌25/우27, 960px 기준):
//   - 서 있는 모델은 세로로 길어(비율 ≈0.56) 세로·가로 여백을 동시에 못 맞춘다.
//   - 그래서 "가로(좌25/우27) 기준"으로 고정한다 → 모델이 프레임을 꽉 채워
//     실제 카탈로그 레퍼런스 룩과 일치한다. 세로 여백은 가운데 정렬로 자동 결정.
//   - mode=height 로 주면 반대로 세로(상23/하18) 기준이 된다(모델이 작게 보임).
//
// 실행:  node scripts/thumbnail-frame.mjs <입력_컷아웃.png> <출력_960.png> [width|height] [edeed|transparent]
//   기본 모드: width (권장), 기본 배경: edeed(#EDEDED). transparent=투명 배경 출력.
// ─────────────────────────────────────────────────────────────────────────────
import sharp from "sharp";

const SRC = process.argv[2];
const OUT = process.argv[3];
const MODE = process.argv[4] || "width"; // width=가로25/27 기준(권장) | height=세로23/18 기준
const TRANSPARENT = (process.argv[5] || "").toLowerCase() === "transparent"; // 투명 배경 출력 여부

if (!SRC || !OUT) {
  console.error("사용법: node scripts/thumbnail-frame.mjs <입력.png> <출력.png> [width|height]");
  process.exit(1);
}

// ── 카탈로그 규격 ──
const CANVAS = parseInt(process.env.THUMB_SIZE || "1600", 10); // 기본 1600 × 1600 (THUMB_SIZE 로 변경)
const BG = { r: 0xed, g: 0xed, b: 0xed }; // #EDEDED
const TOP_MARGIN = 0.23; // 가이드 상단 23%
const SUBJECT_H = 0.59; // 100 - 23(상) - 18(하) = 59%
const LEFT_MARGIN = 0.25; // 가이드 좌측 25%
const SUBJECT_W = 0.48; // 100 - 25(좌) - 27(우) = 48%
const MAX_SUBJECT_H = 0.9; // 세로 상한 90% — 넘으면 잘리므로 가드(팔/손/하체 보존)
const ALPHA_T = 16; // 피사체로 간주할 알파 임계값

const W_ = (v) => ((v / CANVAS) * 100).toFixed(1) + "%";

const src = sharp(SRC);
const meta = await src.metadata();
const W = meta.width;
const H = meta.height;

// ── 알파 채널로 모델 바운딩박스 검출 ──
const { data } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > ALPHA_T) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
if (maxX < 0) {
  console.error("피사체를 찾지 못했습니다(전부 투명). 입력이 알파 PNG인지 확인하세요.");
  process.exit(1);
}
const bboxW = maxX - minX + 1;
const bboxH = maxY - minY + 1;

// ── 배치 계산 ──
let newW, newH, topPx, leftPx;
if (MODE === "height") {
  // 세로(상23/하18) 기준: 높이를 59%로, 가로는 가운데 정렬
  newH = Math.round(CANVAS * SUBJECT_H);
  newW = Math.max(1, Math.round(bboxW * (newH / bboxH)));
  topPx = Math.round(CANVAS * TOP_MARGIN);
  leftPx = Math.round((CANVAS - newW) / 2);
} else {
  // 가로(좌25/우27) 기준(권장): 폭을 48%로, 세로는 가운데 정렬
  newW = Math.round(CANVAS * SUBJECT_W);
  newH = Math.max(1, Math.round(bboxH * (newW / bboxW)));
  const maxH = Math.round(CANVAS * MAX_SUBJECT_H);
  if (newH > maxH) {
    // 키가 너무 커서 세로로 넘침(하체 더 나온 컷) → 높이 상한에 맞춰 축소,
    // 가로는 가운데 정렬. 팔/손/하체가 잘리지 않도록 전신을 항상 포함.
    newH = maxH;
    newW = Math.max(1, Math.round(bboxW * (newH / bboxH)));
    leftPx = Math.round((CANVAS - newW) / 2);
  } else {
    leftPx = Math.round(CANVAS * LEFT_MARGIN);
  }
  topPx = Math.round((CANVAS - newH) / 2);
}

// ── 컷아웃 추출 → 리사이즈 → #EDEDED 캔버스에 합성 ──
const subject = await sharp(SRC)
  .extract({ left: minX, top: minY, width: bboxW, height: bboxH })
  .resize(newW, newH, { fit: "fill" })
  .png()
  .toBuffer();

const canvas = sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: TRANSPARENT ? { r: 0, g: 0, b: 0, alpha: 0 } : { ...BG, alpha: 1 },
  },
}).composite([{ input: subject, left: leftPx, top: topPx }]);

await (TRANSPARENT ? canvas : canvas.flatten({ background: BG })).png().toFile(OUT);

console.log(
  JSON.stringify(
    {
      mode: MODE,
      bg: TRANSPARENT ? "transparent" : "#EDEDED",
      source: `${W}x${H}`,
      bboxAspect: (bboxW / bboxH).toFixed(3),
      placed: { newW, newH, leftPx, topPx },
      margins: {
        top: W_(topPx),
        bottom: W_(CANVAS - (topPx + newH)),
        left: W_(leftPx),
        right: W_(CANVAS - (leftPx + newW)),
      },
      out: OUT,
    },
    null,
    2
  )
);
