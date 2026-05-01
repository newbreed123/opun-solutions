import { NextRequest, NextResponse } from "next/server";

// Simple email contact handler
// This is a basic implementation. In production, integrate with:
// - Formspree: https://formspree.io (no backend needed)
// - SendGrid: https://sendgrid.com
// - Resend: https://resend.com
// - Nodemailer with SMTP

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual email service
    // Option 1: Use Formspree (no code needed, just use their endpoint)
    // Option 2: Use Resend API
    // Option 3: Use SendGrid API
    // Option 4: Use Nodemailer with SMTP

    // For now, log the submission
    console.log("Contact form submission:", {
      name: body.name,
      email: body.email,
      phone: body.phone || "Not provided",
      service: body.service,
      message: body.message,
      timestamp: new Date().toISOString(),
    });

    // In production, send email here
    // await sendEmail({
    //   to: "hello@opun.com",
    //   from: body.email,
    //   subject: `New Contact: ${body.name} - ${body.service}`,
    //   text: body.message,
    //   replyTo: body.email,
    // });

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you for your message! We'll get back to you within 24 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}
