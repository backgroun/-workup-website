"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  DEFAULT_PR_ROOM, normalizePrRoom, type PrRoomConfig, type PrPost,
} from "@/lib/pr-room";

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400";

function uid() {
  return "pr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyPost(order: number): PrPost {
  return {
    id: uid(),
    title: "",
    date: "",
    image_url: "",
    summary: "",
    body: "",
    link: "",
    is_visible: true,
    sort_order: order,
  };
}

// 업로드 전 자동 리사이징(최장변 1800px 이하, 비율 유지) — editorial 관리와 동일 패턴
async function resizeImage(file: File, maxPx = 1800): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const max = Math.max(img.width, img.height);
      if (max <= maxPx) { resolve(file); return; }
      const ratio = maxPx / max;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob
          ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
          : file),
        "image/jpeg", 0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file); };
    img.src = objUrl;
  });
}

// 이미지 업로드 필드 (클릭 + 드래그&드롭)
function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setErr("이미지 파일만 업로드 가능합니다."); return; }
    setErr(""); setUploading(true);
    try {
      const resized = await resizeImage(file);
      const fd = new FormData();
      fd.append("file", resized);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "업로드 실패");
      onChange(json.url as string);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally { setUploading(false); }
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => !uploading && ref.current?.click()}
        className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-[4/3] ${
          dragging ? "border-[#ff550c] bg-orange-50" :
          value ? "border-gray-200 hover:border-gray-300" :
                  "border-dashed border-gray-300 hover:border-[#1A2B4A]"
        }`}
      >
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
            <svg className={`w-7 h-7 ${dragging ? "text-[#ff550c]" : "text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-[11px] text-gray-400 text-center leading-snug px-2">클릭 또는 드래그<br/>(권장 4:3)</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {value && (
        <button type="button" onClick={() => onChange("")} className="mt-1.5 text-[11px] text-red-400 hover:text-red-600">이미지 제거</button>
      )}
      {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
    </div>
  );
}

export default function PrRoomManagePage() {
  const [config, setConfig] = useState<PrRoomConfig>(DEFAULT_PR_ROOM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/pr_room")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setConfig(normalizePrRoom(data)))
      .catch(() => setConfig(DEFAULT_PR_ROOM))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  const updatePost = (i: number, patch: Partial<PrPost>) => setConfig((p) => {
    const posts = [...p.posts];
    posts[i] = { ...posts[i], ...patch };
    return { ...p, posts };
  });
  const addPost = () => setConfig((p) => ({ ...p, posts: [emptyPost(p.posts.length), ...p.posts] }));
  const removePost = (i: number) => setConfig((p) => ({ ...p, posts: p.posts.filter((_, idx) => idx !== i) }));
  const movePost = (i: number, dir: -1 | 1) => setConfig((p) => {
    const j = i + dir;
    if (j < 0 || j >= p.posts.length) return p;
    const posts = [...p.posts];
    [posts[i], posts[j]] = [posts[j], posts[i]];
    return { ...p, posts };
  });

  const save = async () => {
    setSaving(true);
    // 화면 순서대로 sort_order 재부여 후 저장
    const payload: PrRoomConfig = {
      ...config,
      posts: config.posts.map((post, idx) => ({ ...post, sort_order: idx })),
    };
    try {
      const r = await fetch("/api/admin/site-settings/pr_room", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      flash(r.ok ? "PR룸을 저장했습니다." : "저장에 실패했습니다.");
    } catch {
      flash("저장에 실패했습니다.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PR룸 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            뉴스·홍보 소식을 이미지형 게시판으로 등록합니다. 공개 페이지:{" "}
            <Link href="/pr" target="_blank" className="text-blue-600 hover:underline font-mono">/pr</Link>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={save} disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "저장 중..." : "전체 저장"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* 페이지 헤더 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">페이지 상단 문구</p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">제목</label>
            <input className={INPUT} value={config.title} onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">부제</label>
            <input className={INPUT} value={config.subtitle} onChange={(e) => setConfig((p) => ({ ...p, subtitle: e.target.value }))} />
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">소식 ({config.posts.length})</p>
          <button onClick={addPost}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            소식 추가
          </button>
        </div>

        {config.posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-sm text-slate-400">등록된 소식이 없습니다. 위 [+ 소식 추가]를 눌러 시작하세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {config.posts.map((post, i) => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">#{i + 1}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={post.is_visible}
                        onChange={(e) => updatePost(i, { is_visible: e.target.checked })}
                        className="w-4 h-4 accent-blue-600" />
                      <span className={`text-xs font-medium ${post.is_visible ? "text-blue-600" : "text-gray-400"}`}>
                        {post.is_visible ? "공개" : "숨김"}
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => movePost(i, -1)} disabled={i === 0} title="위로"
                      className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">↑</button>
                    <button onClick={() => movePost(i, 1)} disabled={i === config.posts.length - 1} title="아래로"
                      className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">↓</button>
                    <button onClick={() => removePost(i)} title="삭제"
                      className="w-7 h-7 flex items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50">✕</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5">
                  {/* 이미지 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">대표 이미지</label>
                    <ImageField value={post.image_url} onChange={(url) => updatePost(i, { image_url: url })} />
                  </div>

                  {/* 본문 필드 */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">제목</label>
                        <input className={INPUT} value={post.title} placeholder="소식 제목"
                          onChange={(e) => updatePost(i, { title: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">날짜</label>
                        <div className="flex gap-1.5">
                          <input className={INPUT} value={post.date} placeholder="2026.06.26"
                            onChange={(e) => updatePost(i, { date: e.target.value })} />
                          <button type="button"
                            onClick={() => {
                              const d = new Date();
                              const s = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
                              updatePost(i, { date: s });
                            }}
                            className="flex-shrink-0 px-2.5 text-[11px] border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">오늘</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">요약 (카드·목록 표시)</label>
                      <input className={INPUT} value={post.summary} placeholder="한 줄 요약"
                        onChange={(e) => updatePost(i, { summary: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">본문 (상세 페이지)</label>
                      <textarea rows={4} className={INPUT + " resize-none"} value={post.body}
                        placeholder="상세 내용. 줄바꿈이 그대로 표시됩니다."
                        onChange={(e) => updatePost(i, { body: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">외부 링크 (선택)</label>
                      <input className={INPUT + " font-mono"} value={post.link} placeholder="https://instagram.com/..."
                        onChange={(e) => updatePost(i, { link: e.target.value })} />
                      <p className="text-[11px] text-gray-400 mt-1">
                        입력 시 카드 클릭하면 이 링크로 이동(새 탭). 비우면 사이트 내 상세 페이지로 이동합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "저장 중..." : "전체 저장"}
        </button>
      </div>
    </div>
  );
}
