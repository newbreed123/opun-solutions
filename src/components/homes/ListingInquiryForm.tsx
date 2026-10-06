"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { brittanySiteConfig } from "@/content/brittany";
import {
  buildListingInquiryContext,
  formatAddress,
  formatPrice,
} from "@/lib/real-estate/listings/format";
import type { ListingCardModel } from "@/lib/real-estate/listings/types";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function ListingInquiryForm({
  home,
  defaultInquiryType = "Ask About This Home",
}: {
  home: ListingCardModel;
  defaultInquiryType?: string;
}) {
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const pageUrl = window.location.href;
    const inquiryType =
      String(formData.get("inquiryType") || defaultInquiryType) ||
      defaultInquiryType;

    setSubmission({ status: "submitting" });

    const response = await fetch("/api/real-estate/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        preferredContactMethod: String(
          formData.get("preferredContactMethod") || "",
        ),
        message: String(formData.get("message") || ""),
        listingKey: home.listingKey,
        listingId: home.listingId || "",
        listingAddress: formatAddress(home),
        listingPrice: formatPrice(home.price),
        inquiryType,
        pageUrl,
        context: buildListingInquiryContext({ home, pageUrl, inquiryType }),
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
      error?: string;
    } | null;

    if (!response.ok || !payload?.success) {
      setSubmission({
        status: "error",
        message:
          payload?.error ||
          `We could not send your message right now. Please call or text ${brittanySiteConfig.agentFirstName}.`,
      });
      return;
    }

    form.reset();
    setSubmission({
      status: "success",
      message:
        payload.message ||
        `Thanks. ${brittanySiteConfig.agentFirstName} will get your message.`,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="listingKey" value={home.listingKey} />

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-primary">Name</span>
        <input
          name="name"
          required
          className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-base text-primary outline-none focus:border-brand-cyan"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-base text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-primary">
            Email
          </span>
          <input
            name="email"
            type="email"
            className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-base text-primary outline-none focus:border-brand-cyan"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-primary">
          Preferred Contact
        </span>
        <select
          name="preferredContactMethod"
          required
          defaultValue="Text"
          className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-base text-primary outline-none focus:border-brand-cyan"
        >
          <option>Text</option>
          <option>Call</option>
          <option>Email</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-primary">
          What would you like?
        </span>
        <select
          name="inquiryType"
          defaultValue={defaultInquiryType}
          className="h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-base text-primary outline-none focus:border-brand-cyan"
        >
          <option>Ask About This Home</option>
          <option>Schedule a Tour</option>
          <option>Get More Information</option>
          <option>I Like This Home</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-primary">
          Message
        </span>
        <textarea
          name="message"
          rows={3}
          placeholder="Optional"
          className="w-full rounded-lg border border-dark-border bg-dark-deep px-4 py-3 text-base text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
        />
      </label>

      {submission.status === "success" ? (
        <p className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          {submission.message}
        </p>
      ) : null}
      {submission.status === "error" ? (
        <p className="rounded-lg border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm font-semibold text-red-100">
          {submission.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submission.status === "submitting"}
        className="btn-primary min-h-12"
      >
        <Send className="mr-2 h-5 w-5" />
        {submission.status === "submitting"
          ? "Sending..."
          : `Ask ${brittanySiteConfig.agentFirstName}`}
      </button>
    </form>
  );
}
