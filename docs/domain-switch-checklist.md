# workupkorea.com 실전 전환 체크리스트

`www.workupkorea.com` / `workupkorea.com`을 구 홈페이지에서 리뉴얼 사이트로 전환하는 당일 진행 순서.

## 사전 확인 (전환 전 이미 완료된 것)

- [x] `new.workupkorea.com` 서브도메인으로 테스트 완료
- [x] 카카오 Web 플랫폼 도메인에 `https://www.workupkorea.com`, `https://workupkorea.com` 등록 완료 (JavaScript SDK 도메인)

## 당일 진행 순서

### 1. Vercel — 도메인 연결
1. Vercel `web-site` 프로젝트 → Settings → Domains → Add
2. `www.workupkorea.com` 추가 (Connect to an environment → Production)
3. `workupkorea.com` (root/apex) 추가 (Connect to an environment → Production)
4. Vercel이 알려주는 정확한 레코드 값 확인 (root는 CNAME이 아니라 A 레코드일 수 있음 — 화면에 표시되는 값 그대로 사용)

### 2. 가비아 — DNS 레코드 교체
기존 레코드:
```
A     www    211.43.203.11   ← 삭제
A     @      211.43.203.11   ← 삭제
```
**주의**: `db` (A), `MX` (@), `TXT` (@) 레코드는 이메일/기타 서비스용이므로 절대 건드리지 않는다.

새 레코드:
```
CNAME   www   cname.vercel-dns.com.   (마침표 필수)
A       @     [Vercel이 안내하는 apex IP]
```

### 3. Vercel — 환경변수 추가
프로젝트 Settings → Environment Variables:
```
NEXT_PUBLIC_SITE_URL = https://www.workupkorea.com
```
Production 환경에 적용 → 저장 후 **재배포(redeploy)** 필수 (환경변수는 재배포해야 반영됨).

### 4. DNS 반영 대기
보통 몇 분~1시간. Vercel Domains 화면에서 `www.workupkorea.com`, `workupkorea.com` 둘 다 "Valid Configuration"(초록색)으로 바뀔 때까지 확인.

## 전환 후 검증

- [ ] `https://www.workupkorea.com` 접속 → 리뉴얼 사이트 정상 노출
- [ ] `https://workupkorea.com` (www 없이) 접속 → 정상 리다이렉트/노출
- [ ] 카카오맵(매장 위치) 정상 로딩 확인
- [ ] 카카오톡 공유 시 OG 미리보기(제목/이미지) 정상 노출 확인
- [ ] `https://www.workupkorea.com/sitemap.xml`, `/robots.txt` 정상 응답 확인
- [ ] 모바일에서 매장찾기 → 길찾기, 전화 문의, 카카오톡 상담 버튼 정상 작동 확인
- [ ] Google Safe Browsing 경고 없는지 확인 (기존 `*.vercel.app` 도메인에서 발생했던 오탐 이슈 해소 여부)
- [ ] 기존 이메일(회사 메일) 수신 정상 확인 (MX 레코드 안 건드렸는지 재확인)

## 문제 발생 시 롤백

가비아 DNS에서 `www`, `@` 레코드를 원래 값(`A → 211.43.203.11`)으로 되돌리면 구 홈페이지로 즉시 복구된다. DNS 전파 시간(몇 분~1시간) 감안 필요.
