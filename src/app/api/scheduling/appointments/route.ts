import { NextRequest, NextResponse } from "next/server";
import {
  createAppointment,
  getPublicAppointmentSummary,
} from "@/lib/scheduling/appointments";
import { parseJsonBody, validateAppointmentInput } from "@/lib/scheduling/validation";

export const dynamic = "force-dynamic";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const token = request.nextUrl.searchParams.get("token") || "";

  if (!id || !token) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  const appointment = await getPublicAppointmentSummary(id, token);

  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, appointment });
}

export async function POST(request: NextRequest) {
  const limited = isRateLimited(request);
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Too many booking attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const validated = validateAppointmentInput(
    parsed.data,
    request.headers.get("idempotency-key"),
  );

  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const created = await createAppointment(validated.data);

  if (!created.ok) {
    return NextResponse.json(
      { ok: false, error: created.error },
      { status: created.status },
    );
  }

  const params = new URLSearchParams({
    appointment: created.appointment.id,
    token: created.appointment.public_token || "",
  });

  return NextResponse.json({
    ok: true,
    appointmentId: created.appointment.id,
    appointmentToken: created.appointment.public_token,
    confirmationUrl: `/strategy-call-confirmed?${params.toString()}`,
    idempotent: created.idempotent,
  });
}

function isRateLimited(request: NextRequest) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const current = rateLimit.get(key);

  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS;
}

