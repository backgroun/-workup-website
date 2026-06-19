import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // eslint-config-next 업데이트로 추가된 엄격한 룰들 — 기존 코드 전체에서 발생하므로 off 처리.
      // useEffect 내 setState 호출은 이 프로젝트에서 데이터 초기 로드에 관용적으로 사용하는 패턴.
      "react-hooks/set-state-in-effect": "off",
      // 렌더 중 ref 접근 — 일부 서드파티 패턴에서 사용 중.
      "react-compiler/react-compiler": "off",
      // JSX 내 따옴표 이스케이프 — 한국어 컨텐츠에서 발생하는 오탐.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
