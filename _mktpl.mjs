import * as XLSXns from "xlsx";
const XLSX = XLSXns.default && XLSXns.default.utils ? XLSXns.default : XLSXns;
const headers = ["폴더명","상품명","판매가","대카테고리","중카테고리","색상","사이즈","한줄소개","주요특징","브랜드","제조사","원산지","상품코드","소비자가","공급가","시즌","현장추천","메인노출","판매상태"];
const example = ["스너그 부력보조복","스너그 부력보조복","17,500원~","소품","기타","그레이, 차콜그린","M, L, XL, 2XL","안전은 기본, 활동성까지 가볍게 즐기는 라이프베스트","네오프렌 소재; 3cm 부력재; 2중 잠금장치","SNUG","구름과환경","대한민국","SNUG-LV01","","","여름","캠핑","신상품","판매중"];
const ws = XLSX.utils.aoa_to_sheet([headers, example]);
ws["!cols"] = headers.map((h) => ({ wch: ["한줄소개","주요특징"].includes(h) ? 34 : h.length < 4 ? 12 : 16 }));
const guide = XLSX.utils.aoa_to_sheet([
  ["■ 작성 방법"],
  ["1) 한 행 = 한 상품. 1행(헤더)은 그대로 두고 2행부터 입력하세요. (예시 행은 지우고 쓰세요)"],
  ["2) 필수: 상품명, 판매가  /  나머지는 비워도 등록됩니다(관리자에서 보완 가능)"],
  ["3) 색상·사이즈·주요특징처럼 여러 개는 쉼표(,) 또는 세미콜론(;)으로 구분"],
  ["4) 폴더명 = 이미지가 든 폴더 이름. 비우면 상품명과 같은 이름의 폴더를 찾습니다"],
  ["5) 카테고리: 대/중카테고리를 따로 적거나, 안 적으면 소품 > 기타로 등록됩니다"],
  ["6) 이미지는 products-inbox/<폴더명>/ 안에 '대표/'(대표컷)·'상세/'(상세컷)로 넣기 (파일명 자유)"],
  ["7) 메인노출에 '신상품'을 적으면 신상품 뱃지가 붙습니다"],
]);
guide["!cols"] = [{ wch: 92 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "상품목록");
XLSX.utils.book_append_sheet(wb, guide, "작성안내");
XLSX.writeFile(wb, "products-inbox/_상품정보_양식.xlsx");
console.log("✅ 양식 생성: products-inbox/_상품정보_양식.xlsx");
