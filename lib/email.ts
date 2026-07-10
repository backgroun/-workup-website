// 이메일 발송 공통 유틸 (Resend). API 키는 RESEND_API_KEY 환경변수로 설정한다.
import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
  return new Resend(apiKey);
}

export async function sendTempPasswordEmail(to: string, name: string, tempPassword: string): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: `워크업 <${FROM_EMAIL}>`,
    to,
    subject: "[워크업] 임시 비밀번호 안내",
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h2 style="margin: 0 0 16px; font-size: 20px;">임시 비밀번호가 발급되었습니다</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">${name}님, 관리자에 의해 비밀번호가 초기화되었습니다.<br/>아래 임시 비밀번호로 로그인 후 반드시 비밀번호를 변경해주세요.</p>
        <p style="margin: 24px 0; padding: 16px; background: #f4f4f5; border-radius: 8px; font-size: 20px; font-weight: 700; letter-spacing: 1px; text-align: center;">${tempPassword}</p>
        <p style="font-size: 13px; color: #888;">본인이 요청하지 않았다면 매장으로 문의해주세요.</p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}
