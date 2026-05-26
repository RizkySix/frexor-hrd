import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { token: string } },
) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ exists: false });
  }

  const event = await prisma.rSVPEvent.findUnique({
    where: { token: params.token },
    select: { id: true },
  });
  if (!event) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.rSVPResponse.findFirst({
    where: {
      eventId: event.id,
      name: { equals: name, mode: "insensitive" },
    },
    select: {
      name: true,
      status: true,
      dropdownValue: true,
      reason: true,
      submittedAt: true,
    },
  });

  return NextResponse.json({ exists: !!existing, response: existing });
}
