// 지점 출고 패스 공지 — 마감 자동화(크론)와 관리자 수동 버튼이 공유하는 헬퍼.
// 모든 DB 접근은 이 저장소 관례대로 서비스 롤 클라이언트(createAdminClient)를 사용한다.
// 마감 관리는 개별 공지가 아니라 "오늘 등록된 모든 공지"를 한 번에 여닫는 전사 단위 동작이다.
import { createAdminClient } from "./supabase-server";
import { logAudit } from "./audit-server";
import { sendPushToAllStores } from "./push";

export type NoticeStatus = "대기" | "진행중" | "마감";
export type PassStatus = "출고" | "패스";

export type NoticeSchedule = { openTime: string; closeTime: string };
const DEFAULT_SCHEDULE: NoticeSchedule = { openTime: "11:00", closeTime: "14:00" };

// 마감 관리 화면에서 설정하는 오픈/마감 시각 — site_settings(section+config) 재사용, 새 테이블 없음.
export async function getNoticeSchedule(): Promise<NoticeSchedule> {
  const sb = createAdminClient();
  const { data } = await sb.from("site_settings").select("config").eq("section", "notice_schedule").maybeSingle();
  const cfg = data?.config as Partial<NoticeSchedule> | null;
  return { openTime: cfg?.openTime || DEFAULT_SCHEDULE.openTime, closeTime: cfg?.closeTime || DEFAULT_SCHEDULE.closeTime };
}

// 오늘 날짜의 "대기" 공지를 전부 "진행중"으로 전환 — 11:00 크론 또는 관리자의 "지금 전체 오픈하기"에서 호출
export async function openTodaysNotices(opts?: { manual?: boolean }) {
  const sb = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("notices")
    .update({ status: "진행중", opened_at: new Date().toISOString() })
    .eq("notice_date", today)
    .eq("status", "대기")
    .select("id");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length > 0) {
    await logAudit({
      action: "update",
      resource: "notices",
      resourceLabel: "공지",
      summary: `${opts?.manual ? "수동 전체" : "자동"} 오픈 (${rows.length}건)`,
      actorName: opts?.manual ? undefined : "시스템",
    });
    await sendPushToAllStores({
      title: "지점 출고 패스",
      body: `오늘의 공지 ${rows.length}건이 열렸습니다. 출고·패스 여부를 확인해 주세요.`,
    }).catch(() => {});
  }
  return rows;
}

// "진행중"인 공지를 전부 "마감"으로 전환 — 14:00 크론 또는 관리자의 "지금 전체 마감하기"에서 호출
export async function closeOpenNotices(opts?: { manual?: boolean }) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("notices")
    .update({ status: "마감", closed_at: new Date().toISOString() })
    .eq("status", "진행중")
    .select("id");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length > 0) {
    await logAudit({
      action: "update",
      resource: "notices",
      resourceLabel: "공지",
      summary: `${opts?.manual ? "수동 전체" : "자동"} 마감 (${rows.length}건)`,
      actorName: opts?.manual ? undefined : "시스템",
    });
  }
  return rows;
}

export type NoticeCard = {
  notice: {
    id: string;
    status: NoticeStatus;
    notice_date: string;
    // 정식등록된 상품이라도 이번 공지에 한해 대표 사진 아래에 덧붙이는 추가 설명·사진 (상품 자체 데이터는 그대로 둔다)
    description: string | null;
    extraImages: string[];
  };
  product: {
    // 실제 상품(products 테이블) 연결이 있으면 그 id, 마감패스 전용(공지에만 존재)이면 null.
    id: string | null;
    name: string;
    tagline: string | null;
    image_url: string | null;
    // 임시등록의 "나머지 사진"은 상세페이지(detail_blocks)에 등록되는 형태로 저장된다. 마감패스 전용은 항상 빈 배열.
    detail_image_urls: string[];
    isTempOnly: boolean;
  } | null;
  passStatus: PassStatus;
  updatedAt: string | null;
};

export type PassContext = {
  store: { id: number; name: string; manager_name: string | null };
  notices: NoticeCard[];
};

// 토큰 → 지점 → 오늘 등록된 모든 공지(여러 상품을 동시에 공지한 경우 전부)를 한 번에 조회.
// 지점 인증은 이 토큰 매칭이 전부다 — 별도 로그인 없음 (오패스 방지 = 토큰을 아는 것 자체가 지점 인증).
export async function getPassContextByToken(token: string): Promise<PassContext | null> {
  const sb = createAdminClient();

  const { data: store, error: storeErr } = await sb
    .from("stores")
    .select("id, name, manager_name")
    .eq("pass_link_token", token)
    .eq("is_active", true)
    .maybeSingle();
  if (storeErr || !store) return null;

  // "진행중"인 공지는 날짜와 무관하게 보여준다(마감 처리가 하루를 넘겨 늦어지는 경우 누락 방지).
  // "마감"된 공지는 오늘 것만 보여준다(오늘 마감된 상품임을 알림). "대기" 상태는 아직 오픈 전이므로
  // 지점 화면에 아예 노출하지 않는다.
  const today = new Date().toISOString().slice(0, 10);
  const { data: noticeRows } = await sb
    .from("notices")
    .select("id, status, notice_date, product_id, description, extra_images, temp_name, temp_image_url, temp_tagline")
    .or(`status.eq.진행중,and(status.eq.마감,notice_date.eq.${today})`)
    .order("created_at", { ascending: true });

  const noticeList = noticeRows ?? [];
  if (!noticeList.length) return { store, notices: [] };

  const productIds = [...new Set(noticeList.map((n) => n.product_id).filter((id): id is string => Boolean(id)))];
  const { data: products } = productIds.length
    ? await sb.from("products").select("id, name, tagline, image_url, detail_blocks").in("id", productIds)
    : { data: [] as { id: string; name: string; tagline: string | null; image_url: string | null; detail_blocks: unknown }[] };
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const noticeIds = noticeList.map((n) => n.id);
  const { data: entries } = await sb
    .from("pass_entries")
    .select("notice_id, status, updated_at")
    .in("notice_id", noticeIds)
    .eq("store_id", store.id);
  const entryByNotice = new Map((entries ?? []).map((e) => [e.notice_id, e]));

  const notices: NoticeCard[] = noticeList.map((n) => {
    const entry = entryByNotice.get(n.id);
    const p = n.product_id ? productById.get(n.product_id) : undefined;
    const product: NoticeCard["product"] = p
      ? {
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          image_url: p.image_url,
          detail_image_urls: ((p.detail_blocks ?? []) as { imageUrl?: string }[])
            .map((b) => b.imageUrl)
            .filter((u): u is string => Boolean(u)),
          isTempOnly: false,
        }
      : {
          id: null,
          name: n.temp_name ?? "상품 정보 없음",
          tagline: n.temp_tagline,
          image_url: n.temp_image_url,
          detail_image_urls: [],
          isTempOnly: true,
        };
    return {
      notice: {
        id: n.id,
        status: n.status as NoticeStatus,
        notice_date: n.notice_date,
        description: n.description ?? null,
        extraImages: (n.extra_images ?? []) as string[],
      },
      product,
      passStatus: (entry?.status as PassStatus) ?? "출고",
      updatedAt: entry?.updated_at ?? null,
    };
  });

  return { store, notices };
}

// 지점의 패스 상태 변경 — 마감 후에는 절대 허용하지 않는다(서버측 강제).
export async function setPassStatus(noticeId: string, storeId: number, status: PassStatus) {
  const sb = createAdminClient();
  const { data: notice, error: noticeErr } = await sb
    .from("notices")
    .select("id, status")
    .eq("id", noticeId)
    .maybeSingle();
  if (noticeErr || !notice) throw new Error("공지를 찾을 수 없습니다.");
  if (notice.status !== "진행중") throw new Error("마감된 공지는 수정할 수 없습니다.");

  const { data, error } = await sb
    .from("pass_entries")
    .upsert(
      { notice_id: noticeId, store_id: storeId, status, updated_at: new Date().toISOString() },
      { onConflict: "notice_id,store_id" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
