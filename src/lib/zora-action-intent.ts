export type ZoraActionType =
  | "start_audit"
  | "book_strategy_call"
  | "open_report"
  | "download_pdf"
  | "ask_question"
  | "diagnose_growth_system"
  | "unknown";

export type ZoraActionIntent = {
  isAction: boolean;
  actionType: ZoraActionType;
  confidence: "High" | "Moderate" | "Low";
  matchedActionWords: string[];
  matchedAssetWords: string[];
  needsMissingContext?: "websiteUrl" | "reportId" | "email" | null;
};

type ZoraActionIntentInput = {
  message: string;
  websiteUrl?: string;
  hasReport?: boolean;
  reportId?: string;
};

const emptyIntent: ZoraActionIntent = {
  isAction: false,
  actionType: "unknown",
  confidence: "Low",
  matchedActionWords: [],
  matchedAssetWords: [],
  needsMissingContext: null,
};

const explanationStarts = [
  "what is",
  "what does",
  "explain",
  "why",
  "how does",
  "tell me about",
];

const explicitActionPhrases = [
  "can you run",
  "could you run",
  "please run",
  "run the",
  "run audit",
  "run it",
  "please start",
  "start the",
  "start scan",
  "start audit",
  "scan my",
  "audit my",
  "book",
  "schedule",
  "download",
  "export",
  "open report",
  "view report",
];

const actionWords = {
  start_audit: ["run", "start", "scan", "audit", "review", "check", "analyze", "analyse"],
  book_strategy_call: ["book", "schedule", "call", "talk", "meet", "consult", "strategy"],
  download_pdf: ["download", "export", "save", "get"],
  open_report: ["open", "view", "show", "see"],
};

const assetWords = {
  start_audit: ["audit", "scan", "scanner", "website", "site", "store", "url", "report"],
  book_strategy_call: ["call", "strategy", "consultation", "meeting", "appointment"],
  download_pdf: ["pdf", "report", "roadmap", "audit"],
  open_report: ["report", "roadmap", "audit results", "scan results"],
};

export function detectZoraActionIntent(input: ZoraActionIntentInput): ZoraActionIntent {
  const text = normalizeActionText(input.message);

  if (!text) return emptyIntent;

  const isExplanation = explanationStarts.some((prefix) => text.startsWith(prefix));
  const hasExplicitAction = explicitActionPhrases.some((phrase) => text.includes(phrase));

  if (isExplanation && !hasExplicitAction) {
    return emptyIntent;
  }

  if (isDiagnoseGrowthSystemIntent(text)) {
    return {
      isAction: true,
      actionType: "diagnose_growth_system",
      confidence: input.websiteUrl ? "High" : "Moderate",
      matchedActionWords: matchedWords(text, ["diagnose", "help"]),
      matchedAssetWords: matchedWords(text, ["growth system", "business"]),
      needsMissingContext: input.websiteUrl ? null : "websiteUrl",
    };
  }

  const auditIntent = ruleIntent({
    text,
    actionType: "start_audit",
    actionWords: actionWords.start_audit,
    assetWords: assetWords.start_audit,
    hasContext: Boolean(input.websiteUrl),
    needsMissingContext: "websiteUrl",
  });

  if (auditIntent.isAction) return auditIntent;

  const bookingIntent = ruleIntent({
    text,
    actionType: "book_strategy_call",
    actionWords: actionWords.book_strategy_call,
    assetWords: assetWords.book_strategy_call,
    hasContext: true,
    needsMissingContext: null,
  });

  if (bookingIntent.isAction) return bookingIntent;

  const downloadIntent = ruleIntent({
    text,
    actionType: "download_pdf",
    actionWords: actionWords.download_pdf,
    assetWords: assetWords.download_pdf,
    hasContext: Boolean(input.hasReport || input.reportId),
    needsMissingContext: "reportId",
  });

  if (downloadIntent.isAction) return downloadIntent;

  const openReportIntent = ruleIntent({
    text,
    actionType: "open_report",
    actionWords: actionWords.open_report,
    assetWords: assetWords.open_report,
    hasContext: Boolean(input.hasReport || input.reportId),
    needsMissingContext: "reportId",
  });

  if (openReportIntent.isAction) return openReportIntent;

  if (/^(ask question|ask a question|question)$/i.test(text)) {
    return {
      isAction: true,
      actionType: "ask_question",
      confidence: "High",
      matchedActionWords: ["ask"],
      matchedAssetWords: ["question"],
      needsMissingContext: null,
    };
  }

  return emptyIntent;
}

export function normalizeActionText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/\bplz\b/g, "please")
    .replace(/\bscaner\b/g, "scanner")
    .replace(/\baudt\b/g, "audit")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ruleIntent(input: {
  text: string;
  actionType: ZoraActionType;
  actionWords: string[];
  assetWords: string[];
  hasContext: boolean;
  needsMissingContext: ZoraActionIntent["needsMissingContext"];
}): ZoraActionIntent {
  const matchedActionWords = matchedWords(input.text, input.actionWords);
  const matchedAssetWords = matchedWords(input.text, input.assetWords);
  const shorthandAudit =
    input.actionType === "start_audit" &&
    /^(run it|start it|scan it|audit it|lets run it|let us run it|go ahead and run it)$/.test(
      input.text,
    );

  if (!shorthandAudit && (!matchedActionWords.length || !matchedAssetWords.length)) {
    return emptyIntent;
  }

  return {
    isAction: true,
    actionType: input.actionType,
    confidence: input.hasContext ? "High" : "Moderate",
    matchedActionWords,
    matchedAssetWords,
    needsMissingContext: input.hasContext ? null : input.needsMissingContext,
  };
}

function matchedWords(text: string, words: string[]) {
  return words.filter((word) => text.includes(word));
}

function isDiagnoseGrowthSystemIntent(text: string) {
  return (
    /^(diagnose my growth system|diagnose growth system|diagnose my business|help diagnose)$/.test(
      text,
    ) || /^help diagnose (my )?(business|growth|growth system)$/.test(text)
  );
}
