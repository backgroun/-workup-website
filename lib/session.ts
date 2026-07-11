// 회원 세션 쿠키(wu-member) 서명 유틸 — HMAC으로 쿠키값 위조를 막는다.
// login/register가 서명해서 저장하고, 회원id를 읽는 모든 라우트가 검증해서 신뢰한다.
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? process.env.PASSWORD_SALT ?? "wu-session-secret";

function hmac(raw: string): string {
  return createHmac("sha256", SECRET).update(raw).digest("hex");
}

export function signMemberId(id: string | number): string {
  const raw = String(id);
  return `${raw}.${hmac(raw)}`;
}

// 쿠키 원문에서 서명이 유효한 회원id만 꺼낸다. 위조/구버전(미서명) 쿠키는 null.
export function verifyMemberCookie(value: string | undefined | null): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 0) return null;
  const raw = value.slice(0, i);
  const sig = value.slice(i + 1);
  const expected = hmac(raw);
  const expectedBuf = Buffer.from(expected, "hex");
  const sigBuf = Buffer.from(sig, "hex");
  if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) return null;
  return raw;
}
