// 회원 비밀번호 해시 · 임시 비밀번호 생성 공통 유틸.
// login/register/reset-password 라우트가 모두 이 파일을 공유한다.
import { createHash, randomInt } from "crypto";

export function hashPassword(pw: string): string {
  return createHash("sha256").update(pw + (process.env.PASSWORD_SALT ?? "wu-salt")).digest("hex");
}

const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

// 관리자가 비밀번호를 리셋할 때 이메일로 보낼 임시 비밀번호를 생성한다.
export function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return out;
}
