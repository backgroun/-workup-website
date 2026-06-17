// 문의 보여주기 리스트용 — 더미 생성기 + 실제 이름 마스킹 + 공용 피드 타입.
// 서버(시드/피드)와 클라이언트(실시간 드립 애니메이션) 양쪽에서 사용한다.

export type FeedItem = {
  id: string;
  type: string;       // franchise | wholesale
  name: string;       // 마스킹된 표시 이름
  content: string;
  created_at: string; // ISO
};

const SURNAMES = ["김","이","박","최","정","강","조","윤","장","임","오","한","서","신","권","황","안","송","류","홍","전","고","문","손","양","배","백","허","유","남"];
const GIVEN = ["민","서","지","현","준","수","영","호","우","연","진","성","은","재","하","윤","경","태","규","빈","원","주","아","찬","희"];

const FRANCHISE_CONTENT = ["가맹 문의드립니다", "창업 상담 원합니다", "가맹점 개설 문의", "창업 비용 문의드려요", "가맹 절차 궁금합니다", "매장 오픈 상담 요청", "가맹 조건 문의합니다", "창업 설명회 신청"];
const WHOLESALE_CONTENT = ["입점 문의드립니다", "브랜드 입점 문의", "제휴 제안드립니다", "납품 문의드려요", "입점 절차 문의", "유통 제휴 문의", "입점 조건 문의합니다", "B2B 공급 문의"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 더미용 마스킹 이름 (예: 김**, 윤수*, 신*)
export function randomMaskedName(): string {
  const s = pick(SURNAMES);
  return Math.random() < 0.5 ? `${s}${pick(GIVEN)}*` : `${s}*`;
}

// 실제 이름을 표시용으로 마스킹 (홍길동 → 홍**)
export function maskName(name: string): string {
  const n = (name || "").trim();
  if (!n) return "익명";
  if (n.length <= 1) return n;
  return n[0] + "*".repeat(Math.min(2, n.length - 1));
}

// 유형별 일반 문구 (실제 문의 내용은 노출하지 않고 이 문구로 대체 — 개인정보 보호)
export function genericContent(type: string): string {
  return pick(type === "wholesale" ? WHOLESALE_CONTENT : FRANCHISE_CONTENT);
}

// 더미 1건 생성. createdAt 미지정 시 '지금', type 미지정 시 랜덤.
export function makeDummy(opts: { createdAt?: Date; type?: string } = {}): FeedItem {
  const type = opts.type === "franchise" || opts.type === "wholesale" ? opts.type : (Math.random() < 0.5 ? "franchise" : "wholesale");
  return {
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `d_${Math.random().toString(36).slice(2)}_${Math.floor(Math.random() * 1e9)}`,
    type,
    name: randomMaskedName(),
    content: genericContent(type),
    created_at: (opts.createdAt ?? new Date()).toISOString(),
  };
}
