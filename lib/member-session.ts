import { createHmac, timingSafeEqual } from "crypto";

// wu-member 세션 쿠키 서명 — 예전엔 쿠키 값이 회원 id 원문이라, 값을 조작하면
// (예: 관리자 등급 회원의 id) 비밀번호 없이 그 회원을 사칭할 수 있었다(관리자 승격 포함).
// "id.HMAC(id)" 형태로 서명해 위조를 막는다.
// 전용 시크릿(MEMBER_SESSION_SECRET) 미설정 시 서비스 롤 키로 대체한다 — 둘 다 배포마다
// 고유하고 외부에 노출되지 않는 값이라, 추측 가능한 하드코딩 폴백 없이도 항상 안전하게 동작한다.
function sessionSecret(): string {
  return process.env.MEMBER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sign(id: string): string {
  return createHmac("sha256", sessionSecret()).update(id).digest("hex");
}

// 로그인/회원가입 성공 시 쿠키에 저장할 서명된 값을 만든다.
export function signMemberCookie(id: string | number): string {
  const idStr = String(id);
  return `${idStr}.${sign(idStr)}`;
}

// 쿠키 원문("id.hmac")을 검증해 회원 id를 반환한다. 형식이 다르거나 서명이 위조됐으면 null.
export function verifyMemberCookie(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expected = sign(id);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
