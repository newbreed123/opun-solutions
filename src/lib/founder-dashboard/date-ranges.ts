export type FounderDateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "this_month"
  | "this_year"
  | "custom";

export type FounderDateRange = {
  preset: FounderDateRangePreset;
  from: string;
  to: string;
  label: string;
};

const presets = new Set<FounderDateRangePreset>([
  "today",
  "yesterday",
  "last_7_days",
  "this_month",
  "this_year",
  "custom",
]);

export function isFounderDateRangePreset(
  value: string | null | undefined,
): value is FounderDateRangePreset {
  return presets.has(value as FounderDateRangePreset);
}

export function getFounderDateRange(
  preset: string | null | undefined = "today",
  customFrom?: string | null,
  customTo?: string | null,
): FounderDateRange {
  const now = new Date();
  const resolvedPreset: FounderDateRangePreset = isFounderDateRangePreset(preset)
    ? preset
    : "today";

  if (resolvedPreset === "custom") {
    const fallback = todayRange(now);
    const from = startOfLocalDate(customFrom) ?? new Date(fallback.from);
    const to = endOfLocalDate(customTo) ?? new Date(fallback.to);
    const normalizedFrom = from <= to ? from : to;
    const normalizedTo = from <= to ? to : from;

    return {
      preset: "custom",
      from: normalizedFrom.toISOString(),
      to: normalizedTo.toISOString(),
      label: `Custom: ${formatShortDate(normalizedFrom)} - ${formatShortDate(normalizedTo)}`,
    };
  }

  if (resolvedPreset === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return {
      preset: "yesterday",
      from: startOfLocalDay(yesterday).toISOString(),
      to: endOfLocalDay(yesterday).toISOString(),
      label: "Yesterday",
    };
  }

  if (resolvedPreset === "last_7_days") {
    const start = startOfLocalDay(now);
    start.setDate(start.getDate() - 6);
    return {
      preset: "last_7_days",
      from: start.toISOString(),
      to: now.toISOString(),
      label: "Last 7 Days",
    };
  }

  if (resolvedPreset === "this_month") {
    return {
      preset: "this_month",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      to: now.toISOString(),
      label: "This Month",
    };
  }

  if (resolvedPreset === "this_year") {
    return {
      preset: "this_year",
      from: new Date(now.getFullYear(), 0, 1).toISOString(),
      to: now.toISOString(),
      label: "This Year",
    };
  }

  return todayRange(now);
}

function todayRange(now: Date): FounderDateRange {
  return {
    preset: "today",
    from: startOfLocalDay(now).toISOString(),
    to: now.toISOString(),
    label: "Today",
  };
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfLocalDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}

function startOfLocalDate(value: string | null | undefined) {
  const parsed = parseLocalDate(value);
  return parsed ? startOfLocalDay(parsed) : null;
}

function endOfLocalDate(value: string | null | undefined) {
  const parsed = parseLocalDate(value);
  return parsed ? endOfLocalDay(parsed) : null;
}

function parseLocalDate(value: string | null | undefined) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}
