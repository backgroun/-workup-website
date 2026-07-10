"use client";
import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  className?: string;
  // "password": 실제 type=password. "mask": type=text + pw-mask 클래스로 시각적으로만 마스킹
  // (문의글 확인용 4자리 비밀번호처럼, 브라우저가 로그인 비번으로 인식해 저장 팝업을 띄우는 걸 피할 때 사용).
  mode?: "password" | "mask";
};

// 비밀번호 입력 필드 + "보기" 토글. className은 감싸는 wrapper가 아닌 input 자체에 적용된다.
export default function PasswordInput({ className = "", mode = "password", ...rest }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...rest}
        type={mode === "password" ? (show ? "text" : "password") : "text"}
        className={`${className}${mode === "mask" && !show ? " pw-mask" : ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
        aria-pressed={show}
        className="absolute right-0 top-0 h-full w-9 flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        {show ? (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.8 21.8 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.8 21.8 0 01-2.61 3.61M14.12 14.12a3 3 0 11-4.24-4.24" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
