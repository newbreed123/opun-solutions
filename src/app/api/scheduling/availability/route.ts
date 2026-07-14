import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/scheduling/availability";
import { getSchedulingConfig } from "@/lib/scheduling/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || "";
  const timezone =
    request.nextUrl.searchParams.get("timezone") || getSchedulingConfig().timezone;
  const result = await getAvailableSlots({ date, timezone });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    timezone,
    slots: result.slots,
  });
}

