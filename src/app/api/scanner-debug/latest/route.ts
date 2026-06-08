import { NextResponse } from "next/server";
import { readLatestScannerDebugRecord } from "@/lib/scanner-debug-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();

  if (!passcode) {
    return NextResponse.json(
      {
        success: false,
        error: "Scanner debug API is not configured.",
      },
      { status: 503 },
    );
  }

  if (getProvidedPasscode(request) !== passcode) {
    return NextResponse.json(
      {
        success: false,
        error: "Passcode required.",
      },
      { status: 401 },
    );
  }

  const latest = await readLatestScannerDebugRecord();

  if (!latest) {
    return NextResponse.json(
      {
        success: false,
        error: "No scanner debug record found yet.",
        latest: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    latest,
  });
}

function getProvidedPasscode(request: Request) {
  const url = new URL(request.url);
  const queryPasscode = url.searchParams.get("passcode")?.trim();

  if (queryPasscode) {
    return queryPasscode;
  }

  const headerPasscode = request.headers.get("x-opzix-admin-passcode")?.trim();

  if (headerPasscode) {
    return headerPasscode;
  }

  const authorization = request.headers.get("authorization")?.trim();
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i);

  return bearerMatch?.[1]?.trim() ?? "";
}
