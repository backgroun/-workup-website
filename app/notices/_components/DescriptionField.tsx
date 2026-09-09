"use client";
import { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";

// 기존 site_settings(section+config JSONB) 메커니즘을 그대로 재사용 — 새 테이블 없이 문구 템플릿 저장.
const SECTION = "notice_description_templates";

// 템플릿 칩에는 서식(HTML) 없이 미리보기 텍스트만 표시한다 (본문은 HTML 그대로 저장·복원).
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function DescriptionField({ value, onChange, grow }: { value: string; onChange: (v: string) => void; grow?: boolean }) {
  const [templates, setTemplates] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/site-settings/${SECTION}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTemplates(Array.isArray(data?.templates) ? data.templates : []))
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (next: string[]) => {
    setTemplates(next);
    setSaving(true);
    try {
      await fetch(`/api/admin/site-settings/${SECTION}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: next }),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCurrentAsTemplate = () => {
    const text = value.trim();
    if (!text || !stripHtml(text) || templates.includes(text)) return;
    persist([text, ...templates].slice(0, 20));
  };

  const removeTemplate = (t: string) => persist(templates.filter((x) => x !== t));

  return (
    <div className={grow ? "flex flex-col flex-1 min-h-0" : ""}>
      <RichTextEditor value={value} onChange={onChange} grow={grow} />
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[12px] text-gray-400">자주 쓰는 문구는 저장해두고 다시 골라 쓸 수 있습니다.</p>
        <button
          type="button"
          onClick={saveCurrentAsTemplate}
          disabled={!value.trim() || saving}
          className="flex-shrink-0 text-[12px] font-semibold text-[#303236] hover:underline disabled:opacity-40 disabled:hover:no-underline"
        >
          + 현재 문구 저장
        </button>
      </div>
      {loaded && templates.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {templates.map((t) => (
            <span
              key={t}
              className="group inline-flex items-center gap-1 pl-2.5 pr-1 py-1 text-[12px] bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <button type="button" onClick={() => onChange(t)} className="text-gray-700 max-w-[220px] truncate text-left">
                {stripHtml(t)}
              </button>
              <button
                type="button"
                onClick={() => removeTemplate(t)}
                className="w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white"
                aria-label="템플릿 삭제"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
