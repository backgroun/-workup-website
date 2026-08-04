// 관리자 활동 로그 기록 헬퍼 (서버 전용).
// admin API 의 생성/수정/삭제 핸들러에서 호출하면, 현재 로그인 관리자를
// 자동으로 식별해 audit_logs 에 한 줄 요약을 남긴다.
// 로깅 실패가 본 작업(상품 저장 등)을 막아선 안 되므로 모든 오류는 조용히 무시한다.
import { getAdminMember } from "./admin-auth";
import { createAdminClient } from "./supabase-server";

export type AuditAction = "create" | "update" | "delete";

const ACTION_KO: Record<AuditAction, string> = {
  create: "등록",
  update: "수정",
  delete: "삭제",
};

export type AuditEntry = {
  action: AuditAction;
  resource: string;              // 내부 키 (예: "products")
  resourceLabel?: string;        // 한글 분류명 (예: "상품")
  target?: string | null;        // 대상 이름 (예: 제품명)
  targetId?: string | number | null;
  summary?: string;              // 직접 지정. 없으면 자동 생성.
  actorName?: string;            // 로그인 관리자가 없는 호출(크론 등)에서 "시스템"처럼 직접 지정
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = await getAdminMember();
    const label = entry.resourceLabel ?? entry.resource;
    const targetText = entry.target ? ` '${entry.target}'` : "";
    const summary =
      entry.summary ?? `${label}${targetText} ${ACTION_KO[entry.action]}`;

    const sb = createAdminClient();
    await sb.from("audit_logs").insert([{
      actor_id:       admin ? String(admin.id) : null,
      actor_name:     entry.actorName ?? admin?.name ?? "알 수 없음",
      action:         entry.action,
      resource:       entry.resource,
      resource_label: entry.resourceLabel ?? null,
      target:         entry.target ?? null,
      target_id:      entry.targetId != null ? String(entry.targetId) : null,
      summary,
    }]);
  } catch {
    // 의도적 무시: 감사 로그 실패가 본 작업을 중단시키지 않도록 한다.
  }
}
