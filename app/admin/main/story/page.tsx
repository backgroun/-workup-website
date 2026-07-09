"use client";
import StoryEditor from "@/components/story-edit/StoryEditor";

// /story 페이지를 실제 화면 그대로 띄워 글자·이미지·크기를 직접 클릭 편집하는 위지윅 에디터.
// (기존 폼 편집기를 대체) — 편집 로직은 components/story-edit/StoryEditor.tsx 참고.
export default function AdminStoryPage() {
  return <StoryEditor />;
}
