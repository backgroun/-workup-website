// Cloudflare R2 서버 클라이언트(업로드·삭제·서명 URL 발급 공용). 서버 전용 — 클라이언트에서 import 금지.
// R2는 S3 호환 API라 @aws-sdk/client-s3를 그대로 사용한다.
// 지연 생성: 모듈 import 시점이 아니라 실제 호출 시점에 키를 확인해야
// R2 관련 env 미설정 환경(빌드 등)에서도 빌드가 깨지지 않는다.
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

function publicUrl(key: string): string {
  return `${(process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "")}/${key}`;
}

// 파일을 R2에 업로드하고 공개 URL을 반환한다. (서버 프록시 업로드용 — 10MB 이하 파일)
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ url: string; key: string }> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { url: publicUrl(key), key };
}

// 브라우저 → R2 직접 업로드용 presigned PUT URL 발급 (Vercel 프록시 우회, 대용량 파일용).
export async function getR2UploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds }
  );
  return { uploadUrl, publicUrl: publicUrl(key), key };
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  );
}

// R2 공개 URL에서 key(경로)만 추출. 삭제 시 사용.
export function keyFromR2Url(url: string): string | null {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!base || !url.startsWith(base + "/")) return null;
  return url.slice(base.length + 1);
}

// 파일명 충돌 방지용 유니크 키 생성 (folder/타임스탬프-랜덤-원본파일명).
export function uniqueKey(folder: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.\-]/g, "_");
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder.replace(/^\/|\/$/g, "")}/${unique}-${safeName}`;
}
