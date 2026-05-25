const defaultEvidenceLimit = 240;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSentenceKey(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitSentences(value: string) {
  return normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function dedupeSentences(value: string) {
  const seen = new Set<string>();

  return splitSentences(value)
    .filter((sentence) => {
      const key = normalizeSentenceKey(sentence);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .join(" ");
}

function capAtSentence(value: string, maxLength: number) {
  const clean = normalizeWhitespace(value);

  if (clean.length <= maxLength) {
    return clean;
  }

  const sentences = splitSentences(clean);
  let output = "";

  for (const sentence of sentences) {
    const next = output ? `${output} ${sentence}` : sentence;

    if (next.length > maxLength) {
      break;
    }

    output = next;
  }

  if (output.length >= 80) {
    return output;
  }

  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

export function uniqueEvidenceItems(items: string[]) {
  const seen = new Set<string>();

  return items
    .map((item) => normalizeWhitespace(item))
    .filter((item) => {
      const key = normalizeSentenceKey(item);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function joinHumanList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function summarizeCtaLabels(labels: string[], maxLabels = 4) {
  const cleanLabels = uniqueEvidenceItems(labels);
  const sampledLabels = cleanLabels.slice(0, maxLabels);
  const repeated = labels.length > cleanLabels.length;
  const hasMore = cleanLabels.length > sampledLabels.length;

  if (sampledLabels.length === 0) {
    return "No strong CTA labels were found in the visible page sample.";
  }

  if (repeated || hasMore) {
    return `Multiple ${repeated ? "repeated " : ""}CTA labels were detected, including ${joinHumanList(sampledLabels)}.`;
  }

  return `CTA labels sampled: ${joinHumanList(sampledLabels)}.`;
}

function replaceCtaLabelLists(value: string) {
  return value.replace(
    /(Mobile CTA labels detected|Mobile CTA labels|Desktop CTA labels sampled|CTA labels visible|detected CTA labels|CTA labels):\s*([^.;]+)([.;]?)/gi,
    (_match, prefix: string, rawLabels: string) => {
      const labels = rawLabels
        .split(/,|\|/)
        .map((label) => label.trim())
        .filter(Boolean);

      if (labels.length === 0) {
        return `${prefix}: none detected.`;
      }

      return summarizeCtaLabels(labels);
    },
  );
}

export function sanitizeEvidenceText(
  value: string | null | undefined,
  options: { maxLength?: number } = {},
) {
  const maxLength = options.maxLength ?? defaultEvidenceLimit;
  const clean = replaceCtaLabelLists(normalizeWhitespace(value ?? ""));

  if (!clean) {
    return "";
  }

  return capAtSentence(dedupeSentences(clean), maxLength);
}

export function summarizeMobileCtaEvidence({
  mobileVisible,
  mobileLabels,
  desktopLabels,
  linkCount,
  findingEvidence,
}: {
  mobileVisible: boolean | null;
  mobileLabels: string[];
  desktopLabels?: string[];
  linkCount?: number;
  findingEvidence?: string;
}) {
  const labelSummary = summarizeCtaLabels(
    mobileLabels.length > 0 ? mobileLabels : desktopLabels ?? [],
  );
  const visibility =
    mobileVisible === true
      ? "Mobile CTA is visible above the fold."
      : mobileVisible === false
        ? "No strong mobile CTA was detected above the fold."
        : "Mobile CTA visibility was not confirmed.";
  const linkSummary =
    typeof linkCount === "number"
      ? ` Mobile first-screen links: ${linkCount}.`
      : "";
  const findingSummary = findingEvidence
    ? ` ${sanitizeEvidenceText(findingEvidence, { maxLength: 120 })}`
    : "";

  return sanitizeEvidenceText(
    `${visibility} ${labelSummary}${linkSummary}${findingSummary}`,
    { maxLength: 260 },
  );
}

export function buildExecutiveOpportunityText({
  title,
  evidence,
  action,
}: {
  title: string;
  evidence: string;
  action: string;
}) {
  return `${title}: ${sanitizeEvidenceText(evidence, {
    maxLength: 130,
  })} First action: ${sanitizeEvidenceText(action, { maxLength: 140 })}`;
}
