"use client";
import { useEffect, useState } from "react";

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default function PdfDownloadButton({ pdfUrl, fileName }: { pdfUrl: string; fileName: string }) {
  const [size, setSize] = useState<string | null>(null);

  useEffect(() => {
    // HEAD 요청은 CORS 우회를 위해 프록시 경유
    const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
    fetch(proxyUrl, { method: "HEAD" })
      .then((r) => {
        const cl = r.headers.get("content-length");
        if (cl) setSize(formatBytes(Number(cl)));
      })
      .catch(() => {});
  }, [pdfUrl]);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <a
        href={pdfUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors select-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PDF 다운로드
      </a>
      {size && (
        <span className="text-[10px] text-gray-300 pr-1">{size}</span>
      )}
    </div>
  );
}
