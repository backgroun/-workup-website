import type { SizeGuideLine } from "@/data/products";

// 측정 위치 안내 이미지 위에 그리는 가이드선 오버레이 — 이미지는 텍스트 없이 순수 비주얼로 두고,
// 가이드선·라벨은 HTML/CSS 레이어로 별도 렌더링한다 (이미지 내 텍스트 삽입 금지 규칙 준수).
// 부모 요소는 반드시 position:relative 여야 한다.
export default function SizeGuideLinesOverlay({ lines }: { lines: SizeGuideLine[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {lines.map((l, i) => {
        const isH = l.orientation === "horizontal";
        const mid = (l.start + l.end) / 2;
        return (
          <div key={i} className="absolute inset-0">
            {/* 측정선 */}
            <div
              className="absolute bg-[#e11d2e]"
              style={
                isH
                  ? { top: `${l.pos}%`, left: `${l.start}%`, width: `${l.end - l.start}%`, height: "2px", transform: "translateY(-50%)" }
                  : { left: `${l.pos}%`, top: `${l.start}%`, height: `${l.end - l.start}%`, width: "2px", transform: "translateX(-50%)" }
              }
            />
            {/* 끝점 마감선 */}
            <div
              className="absolute bg-[#e11d2e]"
              style={
                isH
                  ? { top: `${l.pos}%`, left: `${l.start}%`, width: "2px", height: "10px", transform: "translate(-50%,-50%)" }
                  : { left: `${l.pos}%`, top: `${l.start}%`, height: "2px", width: "10px", transform: "translate(-50%,-50%)" }
              }
            />
            <div
              className="absolute bg-[#e11d2e]"
              style={
                isH
                  ? { top: `${l.pos}%`, left: `${l.end}%`, width: "2px", height: "10px", transform: "translate(-50%,-50%)" }
                  : { left: `${l.pos}%`, top: `${l.end}%`, height: "2px", width: "10px", transform: "translate(-50%,-50%)" }
              }
            />
            {/* 라벨 */}
            <div
              className="absolute text-[11px] md:text-xs font-bold text-[#e11d2e] whitespace-nowrap bg-white/70 px-1 rounded-sm"
              style={
                isH
                  ? { top: `${l.pos}%`, left: `${mid}%`, transform: "translate(-50%, -160%)" }
                  : { left: `${l.pos}%`, top: `${mid}%`, transform: l.pos < 50 ? "translate(-115%, -50%)" : "translate(15%, -50%)" }
              }
            >
              {l.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
