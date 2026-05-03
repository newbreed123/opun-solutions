import { NextRequest, NextResponse } from "next/server";

interface EcommerceAuditFormData {
  name: string;
  email: string;
  website: string;
  businessType: string;
  revenue: string;
  biggestIssue: string;
  runningAds: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EcommerceAuditFormData = await request.json();

    if (
      !body.name ||
      !body.email ||
      !body.website ||
      !body.businessType ||
      !body.revenue ||
      !body.biggestIssue ||
      !body.runningAds
    ) {
      return NextResponse.json(
        { error: "Missing required fields for ecommerce audit." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    console.log("Ecommerce audit submission:", {
      name: body.name,
      email: body.email,
      website: body.website,
      businessType: body.businessType,
      revenue: body.revenue,
      biggestIssue: body.biggestIssue,
      runningAds: body.runningAds,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your ecommerce audit request has been received.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ecommerce audit form error:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}
