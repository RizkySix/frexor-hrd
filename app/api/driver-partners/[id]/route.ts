import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.driverPartner.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort cleanup of the uploaded blob files. A missing/already-deleted
  // blob should never block deleting the database row.
  const urls = [existing.ktpPhotoUrl, existing.kkPhotoUrl, existing.npwpPhotoUrl];
  for (const url of urls) {
    if (!url) continue;
    try {
      await del(url);
    } catch {
      // ignore — blob may already be gone
    }
  }

  await prisma.driverPartner.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
