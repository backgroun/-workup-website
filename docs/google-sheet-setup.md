# 문의 → 구글시트 + 담당자 이메일 연동 (Apps Script 웹앱)

가맹·창업 / 입점·제휴 / 고객 1:1 문의가 접수되면 **구글시트에 한 줄씩 누적**되고,
설정 시 **담당자 이메일로도 자동 발송**됩니다. 둘 다 **Apps Script 웹앱 하나**로 처리합니다(별도 메일 서비스 불필요).

대상 시트: https://docs.google.com/spreadsheets/d/1-kJNKYOBv9Z3SdI9AtrCM0HORQBMT4J88HnqvbAom_E/edit

> ⚠️ "구글시트에 수집이 안 된다"의 90%는 **(1) Vercel 환경변수 `GOOGLE_SHEET_WEBHOOK_URL` 미설정** 또는 **(2) 웹앱 액세스 권한이 '모든 사용자'가 아님** 입니다.
> 관리자 **문의 관리 → 알림 설정 → 테스트 전송** 버튼으로 즉시 원인을 확인할 수 있습니다.

---

## 1) 시트 헤더 행(선택, 권장)
첫 행에 컬럼명을 넣어두면 보기 좋습니다:

| 접수시각 | 유형 | 이름 | 연락처 | 지역/품목/구분 | 브랜드 | 링크 | 내용 |
|---|---|---|---|---|---|---|---|

## 2) Apps Script 코드 붙여넣기
1. 구글시트 상단 **확장 프로그램 → Apps Script**
2. 기존 코드를 지우고 아래를 붙여넣고 **저장(💾)**:

```javascript
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('문의') || ss.getSheets()[0];
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}

  var typeLabel = d.type_label ||
    (d.type === 'wholesale' ? '입점·제휴' : d.type === 'support' ? '고객 1:1' : '가맹·창업');
  var name = d.name || d.manager || '';
  var extra = d.region || d.category || d.subject || '';   // 지역 / 취급품목 / 문의구분

  // 1) 시트 기록
  sheet.appendRow([
    d.submitted_at || new Date(),
    typeLabel,
    name,
    d.phone || '',
    extra,
    d.brand || '',
    d.link || '',
    d.message || ''
  ]);

  // 2) 담당자 이메일 발송 (notify_email 이 있을 때만)
  if (d.notify_email) {
    try {
      var subject = '[워크업 문의] ' + typeLabel + ' - ' + (name || '이름없음');
      var lines = [
        '유형: ' + typeLabel,
        '이름: ' + name,
        '연락처: ' + (d.phone || '')
      ];
      if (extra)    lines.push('지역/품목/구분: ' + extra);
      if (d.brand)  lines.push('브랜드: ' + d.brand);
      if (d.link)   lines.push('링크: ' + d.link);
      lines.push('내용: ' + (d.message || ''));
      lines.push('접수시각: ' + (d.submitted_at || ''));
      MailApp.sendEmail(d.notify_email, subject, lines.join('\n'));
    } catch (mailErr) { /* 메일 실패는 무시(시트 기록은 유지) */ }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3) 웹앱으로 배포
1. 오른쪽 위 **배포 → 새 배포**
2. ⚙️(유형 선택) → **웹 앱**
3. 설정:
   - 실행 계정: **나(본인)**
   - 액세스 권한: **모든 사용자**  ← 중요 (이게 있어야 사이트가 호출 가능)
4. **배포** → **권한 승인**(본인 구글 계정)
   - 이때 "Gmail 발송" 권한 동의가 함께 뜹니다 — 이메일 발송 기능에 필요하니 **허용**하세요.
5. **웹 앱 URL 복사** (형식: `https://script.google.com/macros/s/XXXXX/exec`)

## 4) 사이트에 URL 등록
- **Vercel** → 프로젝트 → Settings → Environment Variables →
  - Name: `GOOGLE_SHEET_WEBHOOK_URL`
  - Value: 복사한 `…/exec` URL
  - Production·Preview 모두 체크 → 저장 → **재배포**
- (로컬 테스트 시) `.env.local` 에도 `GOOGLE_SHEET_WEBHOOK_URL=...`

## 5) 담당자 이메일 켜기
- 관리자 **문의 관리 → 알림 설정** 탭에서
  - "문의 접수 시 담당자 이메일로 발송" 체크
  - 담당자 이메일 입력 → 저장
- **테스트 전송** 버튼으로 시트 행 + 메일 도착을 즉시 확인하세요.

---

### 참고 / 문제 해결
- **수집이 안 될 때**: 알림 설정 → 테스트 전송 결과를 보세요.
  - "미설정" → Vercel에 `GOOGLE_SHEET_WEBHOOK_URL` 등록 후 재배포.
  - "HTTP 401/403" → 웹앱 액세스 권한이 **모든 사용자**인지 확인.
  - "HTTP 302/200인데 행이 없음" → Apps Script 시트 이름 확인, 또는 코드 수정 후 **재배포** 누락.
- 시트/메일 전송이 실패해도 **문의 접수(Supabase 저장)는 정상 처리**됩니다. 보조 누적/알림용입니다.
- **코드를 수정하면 반드시** "배포 → 배포 관리 → 편집(연필) → 새 버전 → 배포" 로 재배포해야 반영됩니다.
- 이메일은 본인 구글 계정으로 발송됩니다(일반 Gmail 1일 약 100통, Workspace 약 1,500통 한도).
