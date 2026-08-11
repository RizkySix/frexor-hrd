import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SHIRT_SIZES,
  normalizePhone,
  type DriverGender,
  type ShirtSize,
} from "@/lib/driver-size-utils";

type Body = {
  name?: unknown;
  phone?: unknown;
  gender?: unknown;
  size?: unknown;
};

const VALID_GENDERS: DriverGender[] = ["MALE", "FEMALE"];

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const nameRaw = typeof body.name === "string" ? body.name.trim() : "";
  if (!nameRaw) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi." },
      { status: 400 },
    );
  }
  if (nameRaw.length > 100) {
    return NextResponse.json(
      { error: "Nama lengkap maksimal 100 karakter." },
      { status: 400 },
    );
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phoneRaw) {
    return NextResponse.json(
      { error: "Nomor WhatsApp wajib diisi." },
      { status: 400 },
    );
  }
  if (phoneRaw.length > 30) {
    return NextResponse.json(
      { error: "Nomor WhatsApp maksimal 30 karakter." },
      { status: 400 },
    );
  }

  const phoneNormalized = normalizePhone(phoneRaw);
  if (phoneNormalized.length < 8) {
    return NextResponse.json(
      { error: "Nomor WhatsApp tidak valid." },
      { status: 400 },
    );
  }

  const gender = body.gender;
  if (typeof gender !== "string" || !VALID_GENDERS.includes(gender as DriverGender)) {
    return NextResponse.json(
      { error: "Jenis kelamin wajib dipilih." },
      { status: 400 },
    );
  }

  const size = body.size;
  if (typeof size !== "string" || !SHIRT_SIZES.includes(size as ShirtSize)) {
    return NextResponse.json(
      { error: "Ukuran baju wajib dipilih." },
      { status: 400 },
    );
  }

  await prisma.driverSizeSubmission.upsert({
    where: { phoneNormalized },
    create: {
      name: nameRaw,
      phone: phoneRaw,
      phoneNormalized,
      gender: gender as DriverGender,
      size: size as ShirtSize,
    },
    update: {
      name: nameRaw,
      phone: phoneRaw,
      gender: gender as DriverGender,
      size: size as ShirtSize,
    },
  });

  return NextResponse.json({ ok: true });
}
