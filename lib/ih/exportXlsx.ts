import * as XLSX from "xlsx";

/** 목록 화면 공용 Excel 다운로드 — 이미 화면에 뿌려주는 것과 같은 형태의 행 배열을 그대로 시트로 저장한다. */
export function downloadXlsx(filename: string, sheetName: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
