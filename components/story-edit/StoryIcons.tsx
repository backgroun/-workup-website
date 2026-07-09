// 스토리 페이지 아이콘형 섹션(특징 3아이콘 · 핵심가치)용 프리셋 라인아이콘.
// 업로드 없이도 항상 깔끔하게 채워지도록 고정 SVG 세트로 제공한다(관리자는 드롭다운으로 선택만).
import type { SVGProps } from "react";

export type IconKey =
  | "check" | "link" | "scale" | "expand" | "shirt" | "clock"
  | "hanger" | "shield" | "hardhat" | "heart" | "star" | "truck";

type IconFn = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const ICONS: Record<IconKey, IconFn> = {
  check: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4.5 12.5l4.5 4.5L19.5 6" /></svg>,
  link: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M9.5 14.5l5-5M8 10.5l-2 2a3.5 3.5 0 004.95 4.95l2-2M16 13.5l2-2a3.5 3.5 0 00-4.95-4.95l-2 2" /></svg>,
  scale: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3v18M7 7h10M4 7l3 6a3 3 0 006 0L10 7M14 7l3 6a3 3 0 006 0L20 7" /></svg>,
  expand: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 3H4v5M15 3h5v5M9 21H4v-5M15 21h5v-5M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6" /></svg>,
  shirt: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M8 4L3 7l2.5 3L7 9v11h10V9l1.5 1L21 7l-5-3-1.5 1.8a3 3 0 01-5 0z" /></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  hanger: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 4a1.8 1.8 0 011.8 1.8c0 .9-.6 1.4-1.3 1.9L12 8v1.2M4 20l7-5.5a1.5 1.5 0 011.8 0L20 20M3 20h18" /></svg>,
  shield: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3l7 3v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  hardhat: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 16a8 8 0 0116 0z" /><path d="M2 16h20M11 8V5h2v3" /></svg>,
  heart: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 20s-7-4.35-9.3-8.5C1 8 2.7 4.8 6 4.3c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.3.5 5 3.7 3.3 7.2C19 15.65 12 20 12 20z" /></svg>,
  star: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1L3.2 9.3l6.2-.6z" /></svg>,
  truck: (p) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>,
};

export const ICON_OPTIONS: { value: IconKey; label: string }[] = [
  { value: "check", label: "체크" },
  { value: "link", label: "연결(내구성)" },
  { value: "scale", label: "저울(합리성)" },
  { value: "expand", label: "확장(범용성)" },
  { value: "shirt", label: "의류" },
  { value: "clock", label: "시계(일상)" },
  { value: "hanger", label: "옷걸이" },
  { value: "shield", label: "방패(보증)" },
  { value: "hardhat", label: "안전모(현장)" },
  { value: "heart", label: "하트" },
  { value: "star", label: "별" },
  { value: "truck", label: "트럭" },
];

export function StoryIcon({ icon, className }: { icon?: IconKey; className?: string }) {
  const Fn = (icon && ICONS[icon]) || ICONS.check;
  return <Fn className={className} />;
}
