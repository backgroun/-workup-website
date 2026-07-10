"use client";
import { useState } from "react";

// 비밀번호 변경 후 임시 비밀번호를 보여주는 모달 — 이메일 발송 없이,
// 관리자가 전화/카카오톡 등으로 회원에게 직접 전달하는 흐름을 돕는다.
export default function TempPasswordModal({ member, tempPassword, onClose }: {
  member: { name: string; email: string };
  tempPassword: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-7 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">비밀번호가 변경됐습니다</h2>
          <p className="text-[14px] text-gray-400 mt-0.5">{member.name} · {member.email}</p>
        </div>
        <div className="px-7 py-6">
          <p className="text-[14px] text-gray-600 mb-3">아래 임시 비밀번호를 회원에게 전화, 카카오톡 등으로 직접 전달해주세요.</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded text-xl font-bold tracking-wide text-center text-[#303236]">
              {tempPassword}
            </p>
            <button onClick={copy}
              className="px-4 py-3 border border-gray-200 text-[14px] font-semibold text-gray-600 hover:border-gray-400 rounded whitespace-nowrap">
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>
        <div className="px-7 py-5 border-t border-gray-200 flex justify-end">
          <button onClick={onClose}
            className="px-6 py-2.5 bg-[#303236] text-white text-[15px] font-bold hover:bg-[#243d5e] rounded">닫기</button>
        </div>
      </div>
    </div>
  );
}
