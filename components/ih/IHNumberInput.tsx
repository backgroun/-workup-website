"use client";

// 숫자 입력칸 공용 컴포넌트 — 값을 항상 천단위 콤마로 보여주고, 내부 상태는 콤마 없는 숫자 문자열로 다룬다.
// <input type="number">는 콤마 표시를 지원하지 않아 type="text"+inputMode="numeric"로 구현한다.
export default function IHNumberInput({
  value,
  onChange,
  className,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (raw: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const formatted = value ? Number(value).toLocaleString("ko-KR") : "";
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatted}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
