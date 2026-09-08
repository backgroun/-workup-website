"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type UnsupportedReason = "kakao" | "ios-safari" | "ios-old" | "unknown";

function detectUnsupportedReason(): UnsupportedReason {
  const ua = navigator.userAgent;
  const isKakao = /KAKAOTALK/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  if (isKakao) return "kakao";
  if (isIOS) {
    const match = ua.match(/OS (\d+)_/);
    const iosVersion = match ? parseInt(match[1], 10) : 0;
    return iosVersion >= 16 ? "ios-safari" : "ios-old";
  }
  return "unknown";
}

const UNSUPPORTED_INFO: Record<UnsupportedReason, { title: string; steps: string[] }> = {
  kakao: {
    title: "카카오톡 인앱 브라우저는 알림을 지원하지 않습니다",
    steps: [
      "화면 하단의 '···' 또는 '공유' 버튼을 누르세요.",
      "'Safari로 열기' 또는 'Chrome으로 열기'를 선택하세요.",
      "Safari/Chrome에서 다시 이 페이지를 열면 알림을 받을 수 있습니다.",
    ],
  },
  "ios-safari": {
    title: "iPhone에서 알림을 받으려면 홈 화면에 추가해야 합니다",
    steps: [
      "Safari 하단의 공유 버튼(□↑)을 누르세요.",
      "'홈 화면에 추가'를 선택하세요.",
      "홈 화면에 생긴 아이콘으로 앱처럼 실행하면 알림을 받을 수 있습니다.",
    ],
  },
  "ios-old": {
    title: "현재 iOS 버전은 알림을 지원하지 않습니다",
    steps: [
      "iOS 16.4 이상으로 업데이트하면 알림을 받을 수 있습니다.",
      "설정 → 일반 → 소프트웨어 업데이트에서 확인하세요.",
    ],
  },
  unknown: {
    title: "이 브라우저는 알림을 지원하지 않습니다",
    steps: [
      "Chrome 또는 Edge 브라우저로 이 페이지를 열어 주세요.",
      "Android의 경우 Chrome 앱에서 접속하면 알림을 받을 수 있습니다.",
    ],
  },
};

function UnsupportedModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState<UnsupportedReason>("unknown");
  useEffect(() => { setReason(detectUnsupportedReason()); }, []);
  const info = UNSUPPORTED_INFO[reason];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-[14px] font-bold text-[#303236] leading-snug">🔔 {info.title}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none flex-shrink-0">×</button>
        </div>
        <ol className="space-y-3">
          {info.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#303236] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-[13px] text-gray-700 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 text-[13px] font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default function PushSubscribeButton({ token }: { token: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const subscribe = async () => {
    setError("");
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해 주세요.");
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError("알림 설정이 아직 준비되지 않았습니다.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch(`/api/pass/${token}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        setError("구독 등록에 실패했습니다.");
        return;
      }
      setSubscribed(true);
    } catch {
      setError("알림 구독 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/pass/${token}/subscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <>
        <button
          onClick={() => setShowUnsupportedModal(true)}
          className="px-2.5 py-1.5 text-[12px] font-semibold text-gray-400 border border-gray-200 rounded-lg whitespace-nowrap hover:bg-gray-50"
        >
          🔔 알림 미지원 — 받는 방법 ›
        </button>
        {showUnsupportedModal && <UnsupportedModal onClose={() => setShowUnsupportedModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex-shrink-0">
      {subscribed ? (
        <button
          onClick={unsubscribe}
          disabled={busy}
          className="px-2.5 py-1.5 text-[12px] font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
        >
          🔔 알림 켜짐
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={busy}
          className="px-2.5 py-1.5 text-[12px] font-bold text-white bg-[#303236] rounded-lg hover:bg-[#1f2124] disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? "설정 중..." : "🔔 알림받기"}
        </button>
      )}
      {error && <p className="mt-1 text-[11px] text-red-500 max-w-[160px]">{error}</p>}
    </div>
  );
}
