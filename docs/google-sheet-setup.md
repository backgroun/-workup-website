# 문의 → 구글시트 연동 설정 (Apps Script 웹앱)

실제 가맹·창업 / 입점·제휴 문의가 접수되면 구글시트에 자동으로 한 줄씩 누적됩니다.
아래 설정을 **1회만** 하면 됩니다.

대상 시트: https://docs.google.com/spreadsheets/d/1-kJNKYOBv9Z3SdI9AtrCM0HORQBMT4J88HnqvbAom_E/edit

---

## 1) 시트에 헤더 행 만들기 (선택, 권장)
첫 행에 컬럼명을 넣어두면 보기 좋습니다:

| 접수시각 | 유형 | 이름 | 연락처 | 지역/품목 | 브랜드 | 링크 | 내용 |
|---|---|---|---|---|---|---|---|

## 2) Apps Script 코드 붙여넣기
1. 구글시트 상단 메뉴 **확장 프로그램 → Apps Script**
2. 기존 코드를 지우고 아래를 붙여넣고 **저장(💾)**:

```javascript
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('문의') || ss.getSheets()[0];
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}
  sheet.appendRow([
    d.submitted_at || new Date(),
    d.type === 'wholesale' ? '입점·제휴' : '가맹·창업',
    d.name || d.manager || '',
    d.phone || '',
    d.region || d.category || '',
    d.brand || '',
    d.link || '',
    d.message || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3) 웹앱으로 배포
1. 오른쪽 위 **배포 → 새 배포**
2. ⚙️(유형 선택) → **웹 앱**
3. 설정:
   - 설명: 아무거나 (예: 문의 수집)
   - 실행 계정: **나(본인)**
   - 액세스 권한: **모든 사용자**  ← 중요 (이게 있어야 사이트가 호출 가능)
4. **배포** → 권한 승인(본인 구글 계정) → **웹 앱 URL 복사**
   (형식: `https://script.google.com/macros/s/XXXXX/exec`)

## 4) 사이트에 URL 등록
복사한 URL을 환경변수로 등록합니다.

- **Vercel** → 프로젝트 → Settings → Environment Variables →
  - Name: `GOOGLE_SHEET_WEBHOOK_URL`
  - Value: 복사한 `…/exec` URL
  - Production·Preview 모두 체크 → 저장 → **재배포**
- (로컬 테스트 시) `.env.local` 에도 `GOOGLE_SHEET_WEBHOOK_URL=...` 추가

## 5) 확인
배포 후 가맹/제휴 페이지에서 실제로 문의를 한 건 넣어보면 시트에 행이 추가됩니다.

---

### 참고
- 구글시트 기록이 실패해도 **문의 접수 자체는 정상 처리**됩니다(Supabase 저장은 그대로). 시트는 보조 누적용입니다.
- 코드를 수정하면 **다시 "배포 → 배포 관리 → 편집(연필) → 새 버전 → 배포"** 해야 반영됩니다.
- `GOOGLE_SHEET_WEBHOOK_URL` 을 비워두면 시트 연동만 꺼지고 나머지는 그대로 작동합니다.
