"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// 지점 담당자가 공지 오픈 알림(웹푸시)을 켜고 끌 수 있는 버튼.
// 브라우저/OS가 지원하지 않으면(구형 iOS Safari 등) 아무것도 렌더링하지 않는다.
export default function PushSubscribeButton({ token }: { token: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  if (!supported) return null;

  return (
    <div className="mb-4">
      {subscribed ? (
        <button
          onClick={unsubscribe}
          disabled={busy}
          className="w-full px-4 py-2.5 text-[13px] font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          🔔 알림 켜짐 (끄려면 탭)
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={busy}
          className="w-full px-4 py-2.5 text-[13px] font-bold text-white bg-[#303236] rounded-xl hover:bg-[#1f2124] disabled:opacity-50"
        >
          {busy ? "설정 중..." : "🔔 공지 알림 받기"}
        </button>
      )}
      {error && <p className="mt-1.5 text-[12px] text-red-500 text-center">{error}</p>}
    </div>
  );
}
