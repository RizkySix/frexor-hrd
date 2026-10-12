import { createHash, randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { ALLOWED_IMAGE_CONTENT_TYPES, slugify } from "@/lib/driver-partner-utils";

const SLOT_LABELS: Record<string, string> = { ktp: "KTP", kk: "KK", npwp: "NPWP" };

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

// Builds a per-driver folder + human-readable filename, e.g.
// "driver-partners/i-gede-rizky-a1b2c3d4/i-gede-rizky-KTP.jpg" — easy to
// recognize and download/manage from the DO Spaces console. The 8-char NIK
// hash keeps the folder unique per person (name alone can collide) without
// putting the real NIK digits in a public URL. Same name+NIK always maps to
// the same path, so a driver resubmitting their form overwrites their own
// old photos instead of leaving orphaned files behind.
function driverPhotoKey(
  slot: string,
  fullName: string,
  nikDigits: string,
  ext: string,
): string {
  const slotLabel = SLOT_LABELS[slot] ?? slot.toUpperCase();
  const nameSlug = fullName.trim() ? slugify(fullName) : "";

  if (!nameSlug || nikDigits.length !== 16) {
    // Fallback for callers that can't supply a name/NIK yet.
    return `driver-partners/${slot}/${randomUUID()}.${ext}`;
  }

  const nikHash = createHash("sha256").update(nikDigits).digest("hex").slice(0, 8);
  const folder = `${nameSlug}-${nikHash}`;
  return `driver-partners/${folder}/${nameSlug}-${slotLabel}.${ext}`;
}

// Uploads through our own server rather than a presigned browser-direct PUT:
// the DigitalOcean Space fronting this bucket has no working CORS policy for
// cross-origin browser uploads (confirmed blocked even with a valid CORS
// rule applied both via the API and the DO dashboard), so a server relay is
// the reliable path. The client compresses images before sending to stay
// well under typical serverless request-body limits.
export async function uploadObject(
  slot: string,
  fullName: string,
  nikDigits: string,
  originalFileName: string,
  contentType: string,
  body: Uint8Array,
): Promise<{ publicUrl: string }> {
  if (!s3Enabled()) {
    throw new Error("Penyimpanan file belum diaktifkan di server (AWS_STORAGE_ENABLED).");
  }
  const extMatch = originalFileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
  const key = driverPhotoKey(slot, fullName, nikDigits, ext);
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

// Interview applicant photo (the "foto 4x6" box on the form). Grouped in an
// "interview/" prefix with a name-based, human-readable filename plus a short
// random suffix so the console stays browsable and re-picks never collide.
export async function uploadInterviewPhoto(
  fullName: string,
  originalFileName: string,
  contentType: string,
  body: Uint8Array,
): Promise<{ publicUrl: string }> {
  if (!s3Enabled()) {
    throw new Error("Penyimpanan file belum diaktifkan di server (AWS_STORAGE_ENABLED).");
  }
  const extMatch = originalFileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
  const nameSlug = fullName.trim() ? slugify(fullName) : "pelamar";
  const rand = randomUUID().slice(0, 8);
  const key = `interview/${nameSlug}-${rand}/${nameSlug}-foto.${ext}`;
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
