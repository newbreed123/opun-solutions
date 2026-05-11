import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const screenshotDir = path.join(process.cwd(), "public", "audit-screenshots");
const filenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(desktop|mobile)\.png$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!filenamePattern.test(filename)) {
    return NextResponse.json(
      { success: false, error: "Invalid screenshot filename." },
      { status: 400 },
    );
  }

  try {
    const file = await readFile(path.join(screenshotDir, filename));

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Screenshot not found or expired." },
      { status: 404 },
    );
  }
}
