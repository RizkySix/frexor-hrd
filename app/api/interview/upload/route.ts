import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_CONTENT_TYPES, uploadInterviewPhoto } from "@/lib/s3";

// Safety margin under typical serverless request-body limits. The client
// compresses images before sending, so real uploads land far below this.
const MAX_BYTES = 8 * 1024 * 1024;

// Public route: interview applicants upload their 4x6 photo here. Relayed
// through our server to DigitalOcean Spaces (the Space has no working CORS
// policy for cross-origin browser uploads).
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  const fullNameRaw = form.get("fullName");
  const fullName = typeof fullNameRaw === "string" ? fullNameRaw : "";

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
    const { publicUrl } = await uploadInterviewPhoto(
      fullName,
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
