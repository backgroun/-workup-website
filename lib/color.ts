// hex 색상에 알파(투명도)를 적용해 rgba 문자열로 변환한다.
// 슬라이드 텍스트의 "배경 투명도"에 사용 — 글자는 불투명하게 두고 배경만 투명하게.
export function bgColorWithAlpha(color: string, alpha: number): string {
  if (!color) return color;
  const hex = color.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (![r, g, b].some(Number.isNaN)) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
