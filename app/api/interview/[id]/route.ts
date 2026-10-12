import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { deleteByPublicUrl } from "@/lib/s3";
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

  const existing = await prisma.interviewSubmission.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort cleanup of the uploaded photo. A missing/already-deleted
  // object should never block deleting the database row.
  if (existing.photoUrl) {
    await deleteByPublicUrl(existing.photoUrl);
  }

  await prisma.interviewSubmission.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
