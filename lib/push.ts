import webpush from "web-push";
import { createAdminClient } from "./supabase-server";

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@workup.co.kr";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

// 오늘의 공지가 열렸을 때 구독한 모든 지점 담당자 브라우저에 푸시 알림을 보낸다.
// VAPID 키가 아직 설정되지 않았거나 발송이 실패해도 공지 오픈 자체를 막으면 안 되므로 조용히 무시한다.
// 만료/거부된 구독(410/404)은 발견 즉시 구독 목록에서 정리한다.
export async function sendPushToAllStores(payload: { title: string; body: string }) {
  if (!ensureConfigured()) return;
  const sb = createAdminClient();
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, stores(pass_link_token)");
  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (s) => {
      const token = (s.stores as unknown as { pass_link_token: string | null } | null)?.pass_link_token;
      const body = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: token ? `/b/${token}` : "/",
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      } catch (err) {
        const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await sb.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}
