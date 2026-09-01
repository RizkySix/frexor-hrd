import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { ALLOWED_IMAGE_CONTENT_TYPES } from "@/lib/driver-partner-utils";

export { ALLOWED_IMAGE_CONTENT_TYPES };

function s3Enabled(): boolean {
  return process.env.AWS_STORAGE_ENABLED === "true";
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: process.env.AWS_ENDPOINT,
    region: process.env.AWS_DEFAULT_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
  return client;
}

// AWS_BUCKET ("driver_data") is its own real Space, reached through the
// account's shared regional endpoint (AWS_ENDPOINT) via path-style addressing.
function publicUrlFor(key: string): string {
  const base = (process.env.AWS_ENDPOINT ?? "").replace(/\/+$/, "");
  const bucket = process.env.AWS_BUCKET ?? "";
  return `${base}/${bucket}/${key}`;
}

// Uploads through our own server rather than a presigned browser-direct PUT:
// the DigitalOcean Space fronting this bucket has no working CORS policy for
// cross-origin browser uploads (confirmed blocked even with a valid CORS
// rule applied both via the API and the DO dashboard), so a server relay is
// the reliable path. The client compresses images before sending to stay
// well under typical serverless request-body limits.
export async function uploadObject(
  slot: string,
  originalFileName: string,
  contentType: string,
  body: Uint8Array,
): Promise<{ publicUrl: string }> {
  if (!s3Enabled()) {
    throw new Error("Penyimpanan file belum diaktifkan di server (AWS_STORAGE_ENABLED).");
  }
  const extMatch = originalFileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
  const key = `driver-partners/${slot}/${randomUUID()}.${ext}`;
  const bucket = process.env.AWS_BUCKET ?? "";

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return { publicUrl: publicUrlFor(key) };
}

// Best-effort delete by public URL — derives the object key from the URL
// path (everything after the bucket/prefix segment). Never throws; a
// missing/already-deleted object should never block the caller.
export async function deleteByPublicUrl(url: string): Promise<void> {
  if (!s3Enabled()) return;
  try {
    const bucket = process.env.AWS_BUCKET ?? "";
    const marker = `/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const key = decodeURIComponent(url.slice(idx + marker.length));
    if (!key) return;
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // ignore — object may already be gone, or URL didn't match our bucket
  }
}
