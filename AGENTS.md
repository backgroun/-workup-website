<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 프로젝트 개요 (Agent 필독)

이 프로젝트는 **오프라인 방문 유도형 디지털 카탈로그**이다.
온라인 판매가 목적이 아니다. 자세한 규칙은 `CLAUDE.md`를 반드시 참고한다.

## 핵심 금지 사항

- 장바구니, 결제, 체크아웃, 구매하기 버튼을 절대 구현하지 않는다.
- 모든 기능은 "매장 방문 가능성을 높이는가?"를 기준으로 판단한다.

## 기술 스택

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **배포**: Vercel
- **지도**: 카카오맵 API

---

# Git 워크플로우 (Agent 필독)

이 프로젝트는 **회사 PC + 집 PC** 두 환경에서 동시에 작업한다.

## 자동 동기화 시스템

| 파일 | 역할 |
|------|------|
| `auto-sync.ps1` | 30초마다 변경 감지 → 자동 commit + push |
| `start-sync.bat` | 더블클릭으로 스크립트 실행 |

두 파일은 `.gitignore`에 등록되어 있어 GitHub에 올라가지 않는다.

## Agent가 코드를 수정한 후 의무사항

1. 수정한 파일 목록을 사용자에게 명시한다.
2. `auto-sync.bat`이 실행 중이면 30초 내 자동 push됨을 안내한다.
3. 실행 중이 아니면 아래 명령어를 안내한다:

```powershell
cd "D:\WORK_DATA\2026_workup_website"
git add .
git commit -m "변경 내용 요약"
git push
```

## PC 전환 시 절차

```
작업 종료 (Ctrl+C)
  → 다른 PC에서 start-sync.bat 실행
  → 자동으로 git pull 후 최신 코드 적용
```

## commit 메시지 규칙

- 자동 동기화: `auto-sync: yyyy-MM-dd HH:mm:ss`
- 수동 커밋: 변경 내용 한 줄 요약 (한국어 가능)
- 충돌 발생 시: `git pull --rebase` 후 재시도

---

# Agent 작업 원칙

## 작업 전

- `CLAUDE.md` 전체 규칙을 숙지한다.
- 기존 코드 패턴을 먼저 파악한다.
- 요구사항이 불명확하면 구현 전에 반드시 질문한다.

## 작업 중

- 최소 변경 원칙을 따른다.
- 기존 아키텍처를 유지한다.
- 새 라이브러리 도입 시 이유와 장단점을 설명한다.

## 작업 후

- 수정 파일 목록을 명시한다.
- GitHub 동기화 방법을 안내한다.
- 모바일 환경과 오프라인 전환 관점에서 검토한다.

## 답변 형식

```
## 요구사항 이해
## 영향 범위
## 구현 계획
## 코드 변경 내용
## 테스트 방법
## GitHub 동기화 안내
## 추가 개선 제안
```
