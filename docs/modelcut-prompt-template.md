# 모델컷 생성 프롬프트 템플릿 (Magnific용)

상의(tops) 누끼컷 → 모델 착용컷 생성용 **재사용 프롬프트**.
아래 마스터 프롬프트에서 **`[대괄호]` 변수만 골라 바꿔** Magnific에 붙여넣으면 누구나 같은 기준으로 생성된다.

- 전체 워크플로우: [modelcut-thumbnail-pipeline.md](modelcut-thumbnail-pipeline.md)
- 배색 규칙(필수): 강조 제품이 잘 보이게 **대비색**으로 매치 (아래 치트시트)

---

## 1. 사용법 (3단계)

1. **레퍼런스 업로드** — 제품 앞면 + 디테일컷(라벨·지퍼 등)을 Magnific에 올린다. (뒷면 메쉬컷은 제외 — 앞면에 메쉬가 끌려옴)
2. **마스터 프롬프트 복붙** — 아래 프롬프트를 붙이고 `[대괄호]`를 표(2번)에서 골라 채운다.
3. **설정** — mode `Google Nano Banana Pro`, 비율 `1:1`, 해상도 `4k`, 장수 `2`. → 생성 후 가장 정확한 컷 선택.

---

## 2. 마스터 프롬프트 ⭐ 이미지 기반·고정 (권장)

**누끼컷을 레퍼런스로 올리고, 아래 텍스트는 그대로 붙인다.** 제품 설명을 텍스트로 쓸
필요 없음 — "레퍼런스의 옷 그대로"라고만 한다. 바꿀 건 **성별 한 곳**뿐(거의 고정).

```
A Korean man in his late 20s with a friendly, likeable, attractive face and a soft, gentle, relaxed expression.

He wears the EXACT garment shown in the reference image — reproduce it with absolute fidelity: keep the exact color, fabric and construction, every pocket, zipper, pull, seam, strap, panel and patch in its exact position and count. Do not add, remove, recolor, or rearrange any detail. Do NOT render any logo text or letters (a clean logo is overlaid later).

He wears it over a plain white t-shirt. COLOR STYLING (mandatory): the garment is the FEATURED product — choose trousers and shoes in colors that clearly CONTRAST with the garment so the product stands out; never match the garment's own color family (e.g. dark garment → light/beige bottoms; light garment → dark/navy bottoms).

FRAMING: a COMPLETE FULL-BODY standing studio shot — the ENTIRE figure is visible head to toe, top of the head near the top and BOTH FEET AND SHOES fully visible at the bottom with empty floor space beneath. Calm, tidy, symmetric pose, facing forward, shoulders level, head slightly turned, both arms relaxed at the sides with both hands fully visible, legs straight, feet flat. Nothing cropped at any edge.

BACKGROUND & LIGHT: clean seamless light-gray studio background (#ededed), no visible horizon line. Soft, even, shadowless studio lighting. Korean e-commerce catalog full-length product photography, model centered. Photorealistic, sharp focus on the garment details.
```

- **여성 모델**이면 `man→woman`, `his→her`, `He→She` 세 곳만 교체.
- **대비 하의 색을 직접 지정**하고 싶으면(자동선택 대신) 둘째 문단 끝에 한 줄 추가:
  `Specifically use [beige/navy/cream] trousers.`
- 레퍼런스: 앞면 + 디테일컷 여러 장(뒷면 메쉬컷 제외). 많을수록 충실도↑.

> 이 버전은 **제품마다 텍스트를 안 고쳐도 됨** — 누끼만 갈아 끼우면 끝. 색 대비도 AI가
> 옷 색을 보고 자동으로 맞춘다(강제하려면 위 한 줄 추가).

---

## 2-A. 마스터 프롬프트 — 텍스트 설명형 (레퍼런스가 약할 때만)

레퍼런스 화질이 낮거나 디테일이 잘 안 잡힐 때만, 아래처럼 제품을 텍스트로도 보강.

```
A Korean [성별] in [his/her] [나이] with a friendly, likeable, attractive face and a soft, gentle, relaxed expression. [He/She] wears the EXACT [제품색] [제품명] shown in the reference images, over a plain white t-shirt with [대비하의] and clean [신발].

COLOR STYLING (mandatory): the [제품명] is the FEATURED product and is [제품색], so style the rest of the outfit to CONTRAST and make it stand out — plain white t-shirt and [대비하의]. Do NOT use [같은계열] bottoms.

CONSTRUCTION (preserve exactly): [구조설명]. Reproduce all details faithfully from the references: [핵심디테일]. Do not add, remove, recolor, or rearrange any pocket, zipper, strap, or detail. Do NOT render any logo text or letters (a clean logo will be overlaid later).

FRAMING: a COMPLETE FULL-BODY standing studio shot — the ENTIRE figure is visible head to toe, top of the head near the top and BOTH FEET AND SHOES fully visible at the bottom with empty floor space beneath. Calm, tidy, symmetric pose, facing forward, shoulders level, head slightly turned, both arms relaxed at the sides with both hands fully visible, legs straight, feet flat. Nothing cropped at any edge.

BACKGROUND & LIGHT: clean seamless light-gray studio background (#ededed), no visible horizon line. Soft, even, shadowless studio lighting. Korean e-commerce catalog full-length product photography, model centered. Photorealistic, sharp focus on the [제품명] details.
```

> 💡 **로고 팁**: AI는 작은 로고·글자를 항상 뭉갠다. 그래서 프롬프트에 "Do NOT render any
> logo text"를 넣어 **로고는 비워두고**, 생성 후 **깨끗한 로고 PNG를 따로 합성**한다.

---

## 2-B. 선택형(permutation) 버전 — Magnific 드롭다운 문법

Magnific는 **`(옵션1|옵션2|옵션3)`** (괄호+파이프) 문법으로 옵션을 인라인으로 넣는다.
괄호 안 옵션이 스크린샷의 파란 드롭다운 칩이 된다.

```
A Korean man in his late 20s with a friendly, likeable, attractive face and a soft,
gentle, relaxed expression. He wears the EXACT [제품색] [제품명] shown in the reference
images, over a plain white t-shirt with (beige/tan chinos|navy trousers|cream/off-white chinos)
and clean white sneakers.

COLOR STYLING (mandatory): the [제품명] is the FEATURED product, so style the rest to
CONTRAST and make it stand out. Do NOT use same-color-family bottoms.

CONSTRUCTION (preserve exactly): [구조설명]. Reproduce all details faithfully: [핵심디테일].
Do not add, remove, recolor, or rearrange any detail. Do NOT render any logo text.

FRAMING: a COMPLETE FULL-BODY standing studio shot — entire figure head to toe, both feet
and shoes visible at the bottom with floor space beneath, both hands fully visible, calm
symmetric pose. Nothing cropped at any edge. Clean seamless #ededed studio background, soft
shadowless lighting. Korean e-commerce catalog photography, photorealistic, sharp on details.
```

- ⚠️ **모든 조합이 생성됨**(괄호 여러 개 = 곱). "골라 쓰기"는 → 옵션 보고 하나만 남기고 삭제.
- ⚠️ **연동되는 변수는 묶지 말 것**: 성별은 `(man|woman)`로 두면 `man + her`처럼 어긋남 → 성별·대명사는 직접 하나로 고정.
- 안전하게 묶기 좋은 것: **대비 하의 색**, **제품 색**(같은 구조 색만 다를 때), **나이** 정도.

### char / ele / img 칩 (라이브러리 에셋)

`(A|B)` 텍스트 칩과 달리, `char1`·`ele1`·`img1`은 **Magnific 라이브러리 에셋**이다(텍스트로 못 만듦).
- `char` = 캐릭터(모델 얼굴 고정), `ele` = 엘리먼트/제품, `img` = 참고 이미지
- 라이브러리에 등록하면 프롬프트에 칩으로 삽입·교체 가능 → 같은 모델 얼굴을 여러 제품에 재사용.

---

## 3. 변수 채우기 표 (드롭다운처럼 골라 쓰기)

| 변수 | 의미 | 선택지 / 예시 |
|------|------|---------------|
| `[성별]` | 모델 성별 | `man` / `woman` |
| `[his/her]` `[He/She]` | 성별 대명사 | 남: his·He / 여: her·She |
| `[나이]` | 연령대 | `late 20s` / `early 30s` |
| `[제품명]` | 제품 종류 | `multi-pocket utility vest`, `crew-neck knit`, `hooded jacket`, `striped t-shirt` … |
| `[제품색]` | 제품 색 | `black`, `charcoal gray`, `khaki/olive green`, `beige/tan`, `navy`, `white/ivory` … |
| `[대비하의]` | 대비 하의 | **배색 치트시트(4번) 참고** — 예: `beige/tan chino trousers`, `navy blue trousers`, `cream/off-white chinos` |
| `[같은계열]` | 금지 색 | 제품과 같은 계열 — 예: 검정 제품이면 `dark or black`, 베이지면 `beige or light` |
| `[신발]` | 신발 | `white sneakers`, `clean minimal sneakers` |
| `[구조설명]` | 구조 주의 | 예: `the front is solid fabric with NO mesh; mesh is only on the back, not visible from the front` (해당 없으면 생략) |
| `[핵심디테일]` | 보존할 디테일 | 예: `the single front zipper with gold pull and red tab; upper flap pockets; lower bellows cargo pockets; side zip pockets; V-neck collar` |

---

## 4. 배색 대비 치트시트 (필수)

제품이 잘 보이게 **나머지 의상을 대비색**으로. 무조건 베이지가 아니라 **제품에 맞는 대비색**을 고른다.

| 제품(강조) 색 | 추천 대비 하의 | 금지(같은계열) |
|---------------|----------------|----------------|
| 검정 / 차콜 | 베이지·탄 / 라이트 그레이 | 검정·짙은 회색 |
| 그레이 | 베이지·탄 / 네이비 | 회색 |
| 카키 / 올리브 | 크림·오프화이트 / 차콜 | 카키·올리브·카멜 |
| 베이지 / 탄 | 네이비 / 차콜 | 베이지·탄·크림 |
| 네이비 | 베이지·크림 / 라이트 그레이 | 네이비·짙은 파랑 |
| 흰색 / 아이보리 | 네이비·차콜 등 어두운 톤 | 흰색·아이보리 |

> 상의가 아니라 **하의가 강조 제품**이면 반대로 — 상의를 대비색으로.

---

## 5. 채운 예시 (참고)

**JK423 검정 워킹베스트:**
```
A Korean man in his late 20s with a friendly, likeable, attractive face and a soft,
gentle, relaxed expression. He wears the EXACT black multi-pocket utility vest shown
in the reference images, over a plain white t-shirt with beige/tan chino trousers and
clean white sneakers.

COLOR STYLING (mandatory): the vest is the FEATURED product and is black, so style the
rest of the outfit to CONTRAST and make it stand out — plain white t-shirt and beige/tan
chinos. Do NOT use dark or black bottoms.

CONSTRUCTION (preserve exactly): the front is solid black fabric with NO mesh; mesh is
only on the back, not visible from this front view. Reproduce all details faithfully
from the references: the twin front zippers with gold pulls and green tips; upper flap
pockets; lower bellows cargo pockets; side pockets; V-neck collar. Do not add, remove,
recolor, or rearrange any pocket, zipper, strap, or detail. Do NOT render any logo text.

FRAMING: a COMPLETE FULL-BODY standing studio shot — the ENTIRE figure is visible head
to toe ... (이하 마스터 동일)
```

---

## 6. Magnific 설정 요약

| 항목 | 값 |
|------|-----|
| mode(모델) | Google Nano Banana Pro (`imagen-nano-banana-2`) |
| 비율 | 1:1 |
| 해상도 | 4k (반신 크롭 시 선명) |
| 장수 | 2 |
| 레퍼런스 | 앞면 + 디테일컷 (뒷면 메쉬컷 제외) |

생성 후 → 배경 제거 → 960/1600 프레이밍 → 로고 합성 순서는 [modelcut-thumbnail-pipeline.md](modelcut-thumbnail-pipeline.md) 참고.
