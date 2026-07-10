// ImageKit 서버 클라이언트(업로드·삭제·서명 발급 공용). 서버 전용 — 클라이언트에서 import 금지.
// 지연 생성: 모듈 import 시점이 아니라 실제 호출 시점에 키를 확인해야
// IMAGEKIT_PRIVATE_KEY 미설정 환경(빌드 등)에서도 빌드가 깨지지 않는다.
import ImageKit, { toFile } from "@imagekit/nodejs";

let client: ImageKit | null = null;

export function getImagekit(): ImageKit {
  if (!client) {
    client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  }
  return client;
}

export { toFile };
