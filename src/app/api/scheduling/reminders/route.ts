import { NextRequest, NextResponse } from "next/server";
import {
  DISABLED_REMINDERS_RESPONSE,
  appointmentRemindersEnabled,
  processSchedulingReminders,
} from "@/lib/scheduling/reminders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleReminderRequest(request);
}

export async function POST(request: NextRequest) {
  return handleReminderRequest(request);
}

async function handleReminderRequest(request: NextRequest) {
  const secret =
    process.env.OPZIX_SCHEDULING_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  const provided =
    request.headers.get("x-opzix-cron-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const vercelCron = request.headers.get("x-vercel-cron") === "1";

  if (secret ? provided !== secret : !vercelCron) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!appointmentRemindersEnabled()) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      ...DISABLED_REMINDERS_RESPONSE,
    });
  }

  const result = await processSchedulingReminders();
  const errorCount = "errors" in result && result.errors ? result.errors.length : undefined;

  return NextResponse.json(
    {
      ok: result.ok,
      processed: result.processed,
      errorCount,
      error: "error" in result ? "Reminder scan failed." : undefined,
    },
    { status: result.ok ? 200 : 500 },
  );
}
