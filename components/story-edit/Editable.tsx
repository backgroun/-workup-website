"use client";
import { useRef, type CSSProperties, type ElementType, type KeyboardEvent } from "react";
import type { TextFx } from "@/data/story";

// 요소별 개별 서식(fx) → inline style. 설정된 값만 기본 클래스를 덮는다.
// 관리자 폼에서 조정 가능한 항목: 폰트크기·색상·줄간격·자간. align/weight 는 레거시 데이터 호환용.
export function fxToStyle(fx?: TextFx): CSSProperties {
  if (!fx) return {};
  return {
    fontSize: fx.size ? `${fx.size}px` : undefined,
    color: fx.color || undefined,
    lineHeight: fx.lineHeight ?? undefined,
    letterSpacing: fx.letterSpacing !== undefined ? `${fx.letterSpacing}em` : undefined,
    textAlign: fx.align || undefined,
    fontWeight: fx.weight || undefined,
  };
}

// 인라인 편집 프리미티브. onChange 가 없으면(공개 페이지) 순수 태그로 렌더 → 시각 회귀 없음.
// onChange 가 있으면(편집기) contentEditable 로 바뀌어 그 자리에서 타이핑할 수 있다.
// fx 는 공개·편집 양쪽 모두 적용(실제 서식). onActivate 는 편집기에서 이 요소를 서식 툴바 대상으로 지정하며,
// 그 순간 실제 렌더된 폰트 크기(px)를 함께 넘겨 툴바가 "자동" 대신 실제 수치를 바로 보여줄 수 있게 한다.
// active 가 true 면(=지금 서식 툴바의 대상) 파란 테두리를 계속 표시해 "지금 뭘 고치는 중인지" 눈으로 확인 가능.
export default function Editable({
  as, value, onChange, className, style, placeholder, multiline = true, fx, onActivate, active,
}: {
  as?: ElementType;
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  fx?: TextFx;
  onActivate?: (computedPx?: number) => void;
  active?: boolean;
}) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const merged = { ...style, ...fxToStyle(fx) };

  if (!onChange) {
    return (
      <Tag className={className} style={merged}>
        {value}
      </Tag>
    );
  }

  const commit = () => {
    const t = (ref.current?.innerText ?? "").replace(/ /g, " ");
    if (t !== value) onChange(t);
  };

  const fire = () => {
    const px = ref.current ? parseFloat(getComputedStyle(ref.current).fontSize) : undefined;
    onActivate?.(Number.isFinite(px) ? px : undefined);
  };

  return (
    <Tag
      ref={ref as never}
      className={`st-editable ${active ? "st-editable-active" : ""} ${className ?? ""}`}
      style={merged}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); fire(); }}
      onFocus={() => fire()}
      onBlur={commit}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}
