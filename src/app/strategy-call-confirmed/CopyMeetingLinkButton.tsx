"use client";

import { useState } from "react";

type CopyMeetingLinkButtonProps = {
  meetingUrl: string;
};

export default function CopyMeetingLinkButton({
  meetingUrl,
}: CopyMeetingLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyMeetingLink() {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyMeetingLink}
      className="btn btn-secondary px-6 py-3 text-base"
      aria-live="polite"
    >
      {copied ? "Copied" : "Copy meeting link"}
    </button>
  );
}
