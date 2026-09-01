import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_CONTENT_TYPES, uploadObject } from "@/lib/s3";
import { normalizeDigits } from "@/lib/driver-partner-utils";

const VALID_SLOTS = ["ktp", "kk", "npwp"];

// Safety margin under typical serverless request-body limits. The client
// compresses images before sending, so real uploads should land far below
// this — this cap just guards against an uncompressed/oversized file.
const MAX_BYTES = 8 * 1024 * 1024;

// Public route: drivers upload their KTP/KK/NPWP photo here. The file is
// relayed through our server to DigitalOcean Spaces (not a direct
// browser-to-Spaces upload) because the Space has no working CORS policy for
// cross-origin uploads.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const slot = form.get("slot");
  if (typeof slot !== "string" || !VALID_SLOTS.includes(slot)) {
    return NextResponse.json({ error: "Slot dokumen tidak valid." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  // Used to name the stored file after the driver (e.g. "budi-santoso-KTP.jpg")
  // instead of a random id — optional here, uploadObject() falls back to a
  // random key if either is missing/invalid so a photo upload never blocks
  // on this.
  const fullNameRaw = form.get("fullName");
  const fullName = typeof fullNameRaw === "string" ? fullNameRaw : "";
  const nikRaw = form.get("nik");
  const nikDigits = typeof nikRaw === "string" ? normalizeDigits(nikRaw) : "";

  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format file harus JPG, PNG, WEBP, atau HEIC." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ukuran file terlalu besar. Maksimal 8MB." },
      { status: 400 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { publicUrl } = await uploadObject(
      slot,
      fullName,
      nikDigits,
      file.name,
      file.type,
      bytes,
    );
    return NextResponse.json({ publicUrl });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Gagal mengunggah file." },
      { status: 500 },
    );
  }
}
