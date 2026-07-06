export function sanitizeWebsiteToDomain(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";

  const stripped = stripPII(value).trim();

  if (!stripped) return "";

  try {
    const url = new URL(stripped.startsWith("http") ? stripped : `https://${stripped}`);
    return url.hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return stripped
      .replace(/^https?:\/\//i, "")
      .split(/[/?#]/)[0]
      .replace(/^www\./, "")
      .slice(0, 120);
  }
}

export function stripPII(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, "[phone removed]")
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizeZoraQuestion(message: unknown) {
  const text = stripPII(message)
    .replace(/https?:\/\/([^\s/?#]+)[^\s]*/gi, "website $1")
    .replace(/\bwww\.([^\s/?#]+)[^\s]*/gi, "website $1")
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  if (/\b(ai chatbot|chatbot|ai assistant|ai agent)\b/.test(text)) {
    return "Asked about AI chatbot";
  }

  if (/\btracking|analytics|ga4|gtm|conversion tracking|measure\b/.test(text)) {
    return "Asked about tracking";
  }

  if (/\btraffic|visitors|google ads|ads|seo|more customers|acquisition\b/.test(text)) {
    return "Asked how Opzix can help with traffic";
  }

  if (/\b(price|pricing|cost|how much|budget|quote|fee)\b/.test(text)) {
    return "Asked about pricing";
  }

  if (/\b(strategy call|book|schedule|meeting|consultation)\b/.test(text)) {
    return "Asked about booking a strategy call";
  }

  if (/\b(audit|scan|scanner|review my site|website review)\b/.test(text)) {
    return "Asked about the website audit";
  }

  if (/\b(conversion|convert|checkout|cart|form|lead capture)\b/.test(text)) {
    return "Asked about converting visitors";
  }

  if (/\b(follow up|follow-up|crm|lead response|automation)\b/.test(text)) {
    return "Asked about lead follow-up";
  }

  const cleaned = text
    .replace(/\b(my|our)\s+(name|email|phone|number)\s+is\b.*$/i, "")
    .replace(/\bwebsite\s+[a-z0-9.-]+\b/gi, "website domain")
    .trim();

  if (!cleaned) return "Asked an uncategorized question";

  return `Asked about ${cleaned}`.slice(0, 120);
}
