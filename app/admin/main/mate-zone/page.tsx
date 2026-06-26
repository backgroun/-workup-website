"use client";
import { useState, useEffect, useRef } from "react";
import { DEFAULT_MATE_ZONE, normalizeMateZone, type Reel, type MateZoneConfig } from "@/data/mate-zone";

// 최신 config를 동기적으로 참조하기 위한 ref(업로드 콜백에서 stale 방지)

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function emptyReel(): Reel { return { id: uid(), video_url: "", caption: "", link: "" }; }

export default function AdminMateZonePage() {
  const [config, setConfig] = useState<MateZoneConfig>({ ...DEFAULT_MATE_ZONE });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // 항상 최신 config를 가리키는 ref — 업로드 콜백이 stale config를 읽지 않게 한다.
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  useEffect(() => {
    fetch("/api/admin/site-settings/mate_zone")
      .then(r => r.json())
      .then((data: Partial<MateZoneConfig> | null) => setConfig(normalizeMateZone(data)))
      .catch(() => setConfig({ ...DEFAULT_MATE_ZONE }))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  // 서버 저장만 담당. 실패해도 화면 state는 유지(방금 올린 영상이 사라지지 않게).
  const saveConfig = async (next: MateZoneConfig): Promise<boolean> => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/mate_zone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      flash(r.ok ? "저장됐습니다." : "저장 실패 — ‘저장’을 다시 눌러주세요.");
      return r.ok;
    } catch {
      flash("저장 실패 — 네트워크를 확인해 주세요.");
      return false;
    } finally { setSaving(false); }
  };

  // 영상 업로드(브라우저 → Cloudinary, resource_type video) — Vercel 4.5MB 우회
  const uploadVideo = async (file: File, reelId: string) => {
    if (file.size > 100 * 1024 * 1024) { flash("영상이 너무 큽니다 (100MB 이하 · 짧은 압축본 권장)"); return; }
    setUploadingId(reelId);
    try {
      const sig = await fetch("/api/admin/cloudinary-sign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "workup/videos" }),
      }).then(r => r.json());
      if (!sig?.signature) { flash("서명 발급 실패 (로그인 확인)"); return; }
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("folder", sig.folder);
      form.append("signature", sig.signature);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`, { method: "POST", body: form }).then(r => r.json());
      if (up.error) { flash(`업로드 실패: ${up.error.message ?? ""}`); return; }

      // 최신 config(ref) 기준으로 영상 URL 반영 후 저장(낙관적 — 실패해도 미리보기는 유지)
      const latest = configRef.current;
      const next: MateZoneConfig = {
        ...latest,
        reels: latest.reels.map(r => r.id === reelId ? { ...r, video_url: up.secure_url as string } : r),
      };
      setConfig(next);
      await saveConfig(next);
    } catch {
      flash("업로드 실패 (네트워크/용량 확인)");
    } finally { setUploadingId(null); }
  };

  const setReel = (id: string, patch: Partial<Reel>) =>
    setConfig(c => ({ ...c, reels: c.reels.map(r => r.id === id ? { ...r, ...patch } : r) }));

  const addReel = () => setConfig(c => ({ ...c, reels: [...c.reels, emptyReel()] }));

  const removeReel = async (id: string) => {
    if (!confirm("이 릴스를 삭제할까요?")) return;
    const next = { ...config, reels: config.reels.filter(r => r.id !== id) };
    setConfig(next);
    await saveConfig(next);
  };

  const handleDrop = async (target: number) => {
    if (dragIndex === null || dragIndex === target) { setDragIndex(null); setDragOver(null); return; }
    const reels = [...config.reels];
    const [moved] = reels.splice(dragIndex, 1);
    reels.splice(target, 0, moved);
    const next = { ...config, reels };
    setConfig(next);
    setDragIndex(null); setDragOver(null);
    await saveConfig(next);
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MATE ZONE (릴스)</h1>
          <p className="mt-1 text-sm text-gray-500">/people 페이지 하단에 노출되는 짧은 세로 영상(릴스)을 관리합니다. 영상이 1개 이상일 때만 페이지에 표시됩니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <button onClick={addReel}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            릴스 추가
          </button>
        </div>
      </div>

      {/* ── 섹션 제목·문구 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">섹션 제목·문구</h2>
            <p className="text-xs text-slate-400 mt-0.5">MATE ZONE 영역 상단에 표시됩니다.</p>
          </div>
          <button onClick={() => saveConfig(config)} disabled={saving}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">제목</label>
            <input type="text" value={config.title}
              onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
              placeholder="MATE ZONE"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">소개 문구</label>
            <input type="text" value={config.subtitle}
              onChange={e => setConfig(c => ({ ...c, subtitle: e.target.value }))}
              placeholder="현장의 순간들 — 워크업 메이트들의 짧은 영상."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </div>

      {/* ── 릴스 목록 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">릴스 목록 ({config.reels.length})</h2>
          <span className="text-xs text-slate-400">카드를 드래그해 순서 변경 · 권장: 9:16 세로 · MP4 · 짧은 압축본</span>
        </div>

        {config.reels.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            등록된 릴스가 없습니다. 우측 상단 “릴스 추가”로 시작하세요.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {config.reels.map((reel, i) => (
              <div key={reel.id} draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                className={`border rounded-xl p-4 transition-colors ${dragOver === i && dragIndex !== i ? "border-orange-400 bg-orange-50" : "border-slate-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                  <button onClick={() => removeReel(reel.id)} className="text-[11px] font-medium text-red-400 border border-red-200 px-2 py-0.5 hover:bg-red-50 rounded">삭제</button>
                </div>

                <ReelVideoField
                  reel={reel}
                  uploading={uploadingId === reel.id}
                  onUpload={(f) => uploadVideo(f, reel.id)}
                  onClear={() => setReel(reel.id, { video_url: "" })}
                />

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">캡션 (선택)</label>
                    <input type="text" value={reel.caption ?? ""} onChange={e => setReel(reel.id, { caption: e.target.value })}
                      placeholder="예: 새벽 배송 현장에서"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">원본 링크 (선택 · 인스타그램 등)</label>
                    <input type="url" value={reel.link ?? ""} onChange={e => setReel(reel.id, { link: e.target.value })}
                      placeholder="https://www.instagram.com/reel/..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <button onClick={() => saveConfig(config)} disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? "저장 중..." : "이 릴스 저장"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 릴스 영상 업로드 + 미리보기(관리자에서는 확인용으로 음소거 자동재생)
function ReelVideoField({ reel, uploading, onUpload, onClear }: {
  reel: Reel; uploading: boolean; onUpload: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">릴스 영상 <span className="font-normal text-gray-400">(9:16 · MP4)</span></label>
      <input ref={ref} type="file" accept="video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />

      <div className="flex items-start gap-3">
        <div onClick={() => ref.current?.click()}
          className="relative w-24 aspect-[9/16] rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer overflow-hidden bg-black flex-shrink-0">
          {reel.video_url ? (
            <video src={reel.video_url} muted loop autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1 px-2 bg-gray-50">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span className="text-[10px] text-gray-400 text-center leading-tight">{uploading ? "업로드 중..." : "영상 업로드"}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {uploading ? "업로드 중..." : (reel.video_url ? "영상 교체" : "파일 선택")}
          </button>
          {reel.video_url && (
            <button type="button" onClick={onClear} className="block text-xs text-red-400 hover:text-red-600">영상 제거</button>
          )}
          <p className="text-[10px] text-gray-400 leading-relaxed">100MB 이하, 짧은 압축본 권장. 업로드 시 자동 저장됩니다.</p>
        </div>
      </div>
    </div>
  );
}
