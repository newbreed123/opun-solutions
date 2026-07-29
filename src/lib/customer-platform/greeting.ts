type GreetingInput = {
  preferredName?: string | null;
  timezone?: string | null;
  now?: Date;
};

export function customerGreeting({
  preferredName,
  timezone,
  now = new Date(),
}: GreetingInput) {
  const hour = hourInTimezone(now, timezone);
  if (hour === null) return "Welcome back.";

  const daypart =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const name = preferredName?.trim();

  return name ? `Good ${daypart}, ${name}.` : `Good ${daypart}.`;
}

function hourInTimezone(now: Date, timezone?: string | null) {
  const resolvedTimezone = timezone?.trim();
  if (!resolvedTimezone) return null;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: resolvedTimezone,
    }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    return Number.isFinite(hour) ? hour : null;
  } catch {
    return null;
  }
}
