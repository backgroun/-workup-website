// 채널(인스타/유튜브/틱톡/블로그) 아이콘 배지 — 인플루언서 목록(PC/Mobile)이 공통으로 쓴다.

const CHANNEL_ICON_BG: Record<string, string> = {
  Instagram: "bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400",
  YouTube: "bg-red-600",
  TikTok: "bg-slate-900",
  Blog: "bg-emerald-600",
};

function ChannelGlyph({ channel }: { channel: string }) {
  if (channel === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (channel === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.7v1.6c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.2 7.5.2 7.5.2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.8.2-3.5v-1.6c0-1.8-.2-3.5-.2-3.5zM9.9 14.6V8.9l5.6 2.9-5.6 2.8z" />
      </svg>
    );
  }
  if (channel === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M16.5 3c.3 1.9 1.5 3.4 3.5 3.7v2.8c-1.2 0-2.4-.4-3.4-1.1v6.1c0 3-2.4 5.5-5.5 5.5S5.6 17.5 5.6 14.5c0-2.8 2.1-5.1 4.8-5.4v2.9c-1.1.3-2 1.3-2 2.5 0 1.4 1.1 2.6 2.6 2.6s2.6-1.2 2.6-2.6V3h3z" />
      </svg>
    );
  }
  // Blog — 대표 아이콘이 마땅치 않아 알파벳 배지 그대로 사용
  if (channel === "Blog") return <span className="text-[11px] font-bold">B</span>;
  return <span className="text-[9px] font-bold">{channel.slice(0, 2).toUpperCase()}</span>;
}

export default function ChannelIcon({ channel, className = "w-6 h-6" }: { channel: string; className?: string }) {
  const bg = CHANNEL_ICON_BG[channel] ?? "bg-slate-400";
  return (
    <span title={channel} className={`inline-flex flex-shrink-0 items-center justify-center rounded-full text-white ${bg} ${className}`}>
      <ChannelGlyph channel={channel} />
    </span>
  );
}
