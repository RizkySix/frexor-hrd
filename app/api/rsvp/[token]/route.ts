import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRSVPExpired, parseDropdownOptions } from "@/lib/rsvp-utils";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const event = await prisma.rSVPEvent.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      title: true,
      description: true,
      eventAt: true,
      dropdownOptions: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    event: {
      ...event,
      dropdownOptions: parseDropdownOptions(event.dropdownOptions),
    },
    status: isRSVPExpired(event) ? "expired" : "open",
  });
}
