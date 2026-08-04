"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

const COLORS = ["#1f2937", "#b5652e", "#2f4858", "#3e7256", "#b91c1c"];

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-sm max-w-none min-h-[84px] px-3 py-2 text-sm focus:outline-none [&_p]:m-0",
      },
    },
  });

  // 외부에서 값이 바뀌면(템플릿 선택 등) 에디터 내용도 함께 갱신
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded text-[13px] font-bold transition-colors ${
      active ? "bg-[#303236] text-white" : "text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#303236]">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          aria-label="굵게"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnClass(editor.isActive("italic"))} italic`}
          aria-label="기울임"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${btnClass(editor.isActive("strike"))} line-through`}
          aria-label="취소선"
        >
          S
        </button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => editor.chain().focus().setColor(c).run()}
            className="w-5 h-5 rounded-full border-2 border-white shadow ring-1 ring-gray-200"
            style={{ backgroundColor: c }}
            aria-label={`글자색 ${c}`}
          />
        ))}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="ml-1 text-[11px] text-gray-400 hover:text-gray-600"
        >
          서식 지우기
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
