"use client";

import { Clipboard } from "lucide-react";

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 text-sm font-bold text-brand-cyan hover:border-brand-cyan"
      onClick={() => navigator.clipboard.writeText(value).catch(() => undefined)}
    >
      <Clipboard className="h-4 w-4" />
      {label}
    </button>
  );
}
