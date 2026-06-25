// 무료 클라이언트 OCR — 사이즈표 이미지에서 행·열을 추정한다.
// tesseract.js(WASM, 브라우저 내 실행)를 동적 import → 외부 API/키 불필요(완전 무료).
// 정확도 보조 수단이므로 결과는 반드시 사람이 검수·수정하는 전제로 사용한다.
export type OcrTable = { columns: string[]; rows: { cells: string[] }[] };
export type OcrProgress = (pct: number) => void;

type W = { text: string; x: number; y: number; h: number };

// tesseract 결과(data)에서 단어 + 바운딩박스 중심좌표를 수집 (버전별 구조 모두 대응)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectWords(data: any): W[] {
  const out: W[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const push = (w: any) => {
    const t = (w?.text ?? "").trim();
    if (!t || !w?.bbox) return;
    const { x0, y0, x1, y1 } = w.bbox;
    out.push({ text: t, x: (x0 + x1) / 2, y: (y0 + y1) / 2, h: Math.max(1, y1 - y0) });
  };
  if (Array.isArray(data?.words) && data.words.length) {
    data.words.forEach(push);
  } else if (Array.isArray(data?.blocks)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.blocks.forEach((b: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b?.paragraphs ?? []).forEach((p: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p?.lines ?? []).forEach((ln: any) => (ln?.words ?? []).forEach(push))
      )
    );
  } else if (Array.isArray(data?.lines)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.lines.forEach((ln: any) => (ln?.words ?? []).forEach(push));
  }
  return out;
}

// 단어들을 y(행)·x(열)로 군집화해 표를 구성
function buildTable(words: W[]): OcrTable {
  if (words.length === 0) return { columns: [], rows: [] };
  const hs = words.map((w) => w.h).sort((a, b) => a - b);
  const medH = hs[Math.floor(hs.length / 2)] || 12;
  const rowThresh = medH * 0.7;

  // 행 그룹화 — y가 가까운 단어끼리 묶음
  const sorted = [...words].sort((a, b) => a.y - b.y);
  const rows: { yRef: number; ws: W[] }[] = [];
  for (const w of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(w.y - last.yRef) <= rowThresh) {
      last.ws.push(w);
      last.yRef = (last.yRef * (last.ws.length - 1) + w.y) / last.ws.length;
    } else {
      rows.push({ yRef: w.y, ws: [w] });
    }
  }

  // 열 기준 — 단어 수가 가장 많은 행의 x중심을 열 중심으로 사용
  let colRow = rows[0];
  for (const r of rows) if (r.ws.length > colRow.ws.length) colRow = r;
  const colCenters = colRow.ws.map((w) => w.x).sort((a, b) => a - b);
  const nCols = colCenters.length;
  if (nCols === 0) return { columns: [], rows: [] };

  // 각 행의 단어를 가장 가까운 열에 배정(여러 단어면 공백으로 합침 → 다단어 라벨 보존)
  const grid = rows
    .map((r) => {
      const cells: string[][] = Array.from({ length: nCols }, () => []);
      for (const w of [...r.ws].sort((a, b) => a.x - b.x)) {
        let bi = 0;
        let bd = Infinity;
        for (let i = 0; i < nCols; i++) {
          const d = Math.abs(w.x - colCenters[i]);
          if (d < bd) { bd = d; bi = i; }
        }
        cells[bi].push(w.text);
      }
      return cells.map((c) => c.join(" ").trim());
    })
    .filter((cells) => cells.some((c) => c));

  if (grid.length === 0) return { columns: [], rows: [] };
  return { columns: grid[0], rows: grid.slice(1).map((cells) => ({ cells })) };
}

export async function extractSizeTableFromImage(
  file: File | string,
  onProgress?: OcrProgress
): Promise<OcrTable> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("kor+eng", 1, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: (m: any) => {
      if (m?.status === "recognizing text" && onProgress) onProgress(Math.round((m.progress ?? 0) * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file, {}, { blocks: true });
    return buildTable(collectWords(data));
  } finally {
    await worker.terminate();
  }
}

// 값(숫자 포함 토큰)만 행별로 추출 — 한글 라벨/헤더 텍스트는 무시한다.
// 관리자가 만든 표의 "수치 칸"만 채우는 용도(행·열 제목은 그대로 유지).
function buildValueRows(words: W[]): string[][] {
  if (words.length === 0) return [];
  const hs = words.map((w) => w.h).sort((a, b) => a - b);
  const medH = hs[Math.floor(hs.length / 2)] || 12;
  const rowThresh = medH * 0.7;
  const sorted = [...words].sort((a, b) => a.y - b.y);
  const rows: { yRef: number; ws: W[] }[] = [];
  for (const w of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(w.y - last.yRef) <= rowThresh) {
      last.ws.push(w);
      last.yRef = (last.yRef * (last.ws.length - 1) + w.y) / last.ws.length;
    } else {
      rows.push({ yRef: w.y, ws: [w] });
    }
  }
  const hasDigit = (s: string) => /\d/.test(s);
  return rows
    .map((r) => [...r.ws].sort((a, b) => a.x - b.x).filter((w) => hasDigit(w.text)).map((w) => w.text))
    .filter((vals) => vals.length > 0);
}

export async function extractSizeValuesFromImage(
  file: File | string,
  onProgress?: OcrProgress
): Promise<string[][]> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("kor+eng", 1, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: (m: any) => {
      if (m?.status === "recognizing text" && onProgress) onProgress(Math.round((m.progress ?? 0) * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file, {}, { blocks: true });
    return buildValueRows(collectWords(data));
  } finally {
    await worker.terminate();
  }
}
