"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  buildZoraDiagnosis,
  buildZoraResponse,
  recommendZoraNextStep,
  scoreZoraLeadQuality,
  zoraFaqItems,
  ZoraBusinessType,
  ZoraChallenge,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";

const CHATBOT_STATE_KEY = "opzix-ai-chatbot-state";
const BOOKING_LINK_DELAY_MS = 150;
const STRATEGY_CALL_URL = "https://calendly.com/hello-opzix";
const FREE_AUDIT_URL = "/tools/ecommerce-audit-scanner?source=zora";

type GuidedStep =
  | "businessType"
  | "challenge"
  | "explanation";

type ZoraAction =
  | {
      kind: "start";
      label: string;
      value: "diagnose" | "free_audit" | "strategy_call" | "faq";
      tone?: "primary" | "secondary" | "text";
    }
  | {
      kind: "choice";
      label: string;
      step: GuidedStep;
      value: string;
    }
  | {
      kind: "faq";
      label: string;
      question: string;
    }
  | {
      kind: "link";
      label: string;
      href: string;
      booking?: boolean;
    };

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  actions?: ZoraAction[];
};

type ZoraApiResponse = ZoraResponse & {
  poweredBy?: "openai" | "local-diagnosis";
};

const firstStepActions: ZoraAction[] = [
  {
    kind: "start",
    label: "Diagnose my growth system",
    value: "diagnose",
    tone: "primary",
  },
  {
    kind: "start",
    label: "Run free audit",
    value: "free_audit",
    tone: "secondary",
  },
  {
    kind: "start",
    label: "Book strategy call",
    value: "strategy_call",
    tone: "text",
  },
  { kind: "start", label: "FAQ", value: "faq", tone: "text" },
];

const businessTypeChoices: Array<{ label: string; value: ZoraBusinessType }> = [
  { label: "Ecommerce", value: "Ecommerce" },
  { label: "Service", value: "Service Business" },
  { label: "Local Business", value: "Service Business" },
  { label: "Other", value: "Other" },
];

const challengeChoices: Array<{ label: string; value: ZoraChallenge }> = [
  { label: "Traffic", value: "Traffic" },
  { label: "Conversion", value: "Conversion" },
  { label: "Follow-up", value: "Follow-up" },
  { label: "Operations", value: "Operations" },
  { label: "Tracking", value: "Tracking" },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isBookingUrl(href: string) {
  const normalized = href.toLowerCase();

  return (
    normalized.includes("/contact") ||
    normalized.includes("calendly.com") ||
    normalized.includes("source=ai-chatbot") ||
    normalized.includes("source=homepage") ||
    normalized.includes("source=services") ||
    normalized.includes("source=ecommerce-audit")
  );
}

function normalizeProfile(profile: ZoraLeadProfile): ZoraLeadProfile {
  const withRecommendedStep = {
    ...profile,
    recommendedNextStep: recommendZoraNextStep(profile),
  };

  return {
    ...withRecommendedStep,
    leadQuality: scoreZoraLeadQuality(withRecommendedStep),
  };
}

function scannerAction(label = "Start Free Audit"): ZoraAction {
  return {
    kind: "link",
    label,
    href: FREE_AUDIT_URL,
  };
}

function bookingAction(label = "Book Strategy Call"): ZoraAction {
  return {
    kind: "link",
    label,
    href: STRATEGY_CALL_URL,
    booking: true,
  };
}

function actionsFromRecommendation(actions: ZoraResponse["recommendedActions"]): ZoraAction[] {
  return actions.flatMap((action) =>
    action === "strategy_call"
      ? [bookingAction()]
      : action === "free_audit"
        ? [scannerAction("Run Free Audit")]
        : [],
  );
}

function actionTone(action: ZoraAction) {
  if (action.kind === "start") return action.tone || "secondary";
  if (action.kind === "link" && action.booking) return "primary";
  if (action.kind === "link") return "secondary";
  return "secondary";
}

function actionClassName(action: ZoraAction) {
  const tone = actionTone(action);
  const base =
    "inline-flex min-h-8 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-left text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/45";

  if (tone === "primary") {
    return `${base} border border-brand-cyan/70 bg-brand-cyan/20 text-primary shadow-[0_0_24px_rgba(6,182,212,0.12)] hover:bg-brand-cyan/28`;
  }

  if (tone === "text") {
    return `${base} border border-transparent bg-transparent px-1.5 text-muted hover:text-primary`;
  }

  return `${base} border border-dark-border bg-white/[0.045] text-secondary hover:border-brand-cyan/50 hover:bg-brand-cyan/12 hover:text-primary`;
}

function questionForStep(step: GuidedStep): ChatMessage {
  if (step === "businessType") {
    return {
      id: createId("assistant"),
      role: "assistant",
      text: "What type of business do you run?",
      actions: businessTypeChoices.map((choice) => ({
        kind: "choice",
        label: choice.label,
        step,
        value: choice.value,
      })),
    };
  }

  if (step === "challenge") {
    return {
      id: createId("assistant"),
      role: "assistant",
      text: "What's the biggest challenge?",
      actions: challengeChoices.map((choice) => ({
        kind: "choice",
        label: choice.label,
        step,
        value: choice.value,
      })),
    };
  }

  return {
    id: createId("assistant"),
    role: "assistant",
    text: "Tell me what's happening in a sentence or two. I'll use that to give you a sharper first recommendation.",
  };
}

function nextGuidedStep(profile: ZoraLeadProfile): GuidedStep | null {
  if (!profile.businessType) return "businessType";
  if (!profile.challenge) return "challenge";
  return "explanation";
}

function guidedCompletionMessage(profile: ZoraLeadProfile): ChatMessage {
  return {
    id: createId("assistant"),
    role: "assistant",
    text: `${buildZoraDiagnosis(profile)} I've prepared that context for the next step.`,
    actions:
      profile.recommendedNextStep === "strategy_call"
        ? [bookingAction(), scannerAction()]
        : [scannerAction(), bookingAction()],
  };
}

function faqActions(): ZoraAction[] {
  return zoraFaqItems.map((item) => ({
    kind: "faq",
    label: item.question,
    question: item.question,
  }));
}

function matchGuidedText(step: GuidedStep, text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized) return null;

  if (step === "businessType") {
    return businessTypeChoices.find((choice) =>
      normalized.includes(choice.value.toLowerCase()) ||
      normalized.includes(choice.label.toLowerCase()),
    )?.value;
  }

  if (step === "challenge") {
    return challengeChoices.find((choice) =>
      normalized.includes(choice.value.toLowerCase()) ||
      normalized.includes(choice.label.toLowerCase()),
    )?.value;
  }

  return null;
}

export default function OpzixAIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [flowStep, setFlowStep] = useState<GuidedStep | null>(null);
  const [leadProfile, setLeadProfile] = useState<ZoraLeadProfile>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "zora-intro",
      role: "assistant",
      text:
        "Hi, I'm Zora, Opzix's AI Growth Assistant. I can help diagnose where traffic, conversion, follow-up, operations, or tracking is slowing growth.",
      actions: firstStepActions,
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const profileSummary = useMemo(
    () =>
      [
        leadProfile.businessType,
        leadProfile.platform,
        leadProfile.revenueRange,
        leadProfile.challenge,
      ].filter(Boolean),
    [leadProfile],
  );

  function persistChatbotState(nextState: "open" | "closed") {
    try {
      window.localStorage.setItem(CHATBOT_STATE_KEY, nextState);
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
  }

  function appendMessages(nextMessages: ChatMessage[]) {
    setMessages((current) => [...current, ...nextMessages]);
  }

  function clearIntroActions() {
    setMessages((current) =>
      current.map((message) =>
        message.id === "zora-intro" ? { ...message, actions: undefined } : message,
      ),
    );
  }

  function closeChatbot({ persist = true } = {}) {
    setOpen(false);
    setFlowStep(null);

    if (persist) {
      persistChatbotState("closed");
    }
  }

  function toggleChatbot() {
    setOpen((current) => {
      const nextOpen = !current;
      persistChatbotState(nextOpen ? "open" : "closed");
      return nextOpen;
    });
  }

  function openBookingUrlAfterClose(href: string) {
    closeChatbot();

    window.setTimeout(() => {
      window.location.assign(href);
    }, BOOKING_LINK_DELAY_MS);
  }

  function routeToLink(action: Extract<ZoraAction, { kind: "link" }>) {
    if (action.booking || isBookingUrl(action.href)) {
      openBookingUrlAfterClose(action.href);
      return;
    }

    closeChatbot();
    window.location.assign(action.href);
  }

  function startGuidedFlow() {
    const firstMissingStep = nextGuidedStep(leadProfile) || "businessType";
    setFlowStep(firstMissingStep);
    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "Diagnose my growth system",
      },
      questionForStep(firstMissingStep),
    ]);
  }

  function showScannerRoute() {
    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "Run free audit",
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text:
          "I can give you a quick recommendation here, but the free audit scanner can review your actual website and generate a more detailed roadmap.",
        actions: [scannerAction(), bookingAction()],
      },
    ]);
  }

  function showFaq() {
    setFlowStep(null);
    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "FAQ",
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text: "Pick a common question and I'll keep the answer practical.",
        actions: faqActions(),
      },
    ]);
  }

  function answerFaq(question: string) {
    const item = zoraFaqItems.find((faq) => faq.question === question);

    if (!item) return;

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: question,
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text: item.answer,
        actions: [scannerAction(), bookingAction()],
      },
    ]);
  }

  function applyGuidedChoice(step: GuidedStep, value: string, label = value) {
    const patch: ZoraLeadProfile =
      step === "businessType"
        ? { businessType: value as ZoraBusinessType }
        : step === "challenge"
          ? { challenge: value as ZoraChallenge }
          : {};

    const nextProfile = normalizeProfile({
      ...leadProfile,
      ...patch,
    });
    const nextStep = nextGuidedStep(nextProfile);

    setLeadProfile(nextProfile);
    setFlowStep(nextStep);

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: label || "Skip",
      },
      nextStep ? questionForStep(nextStep) : guidedCompletionMessage(nextProfile),
    ]);
  }

  function handleAction(action: ZoraAction) {
    if (action.kind === "start") {
      clearIntroActions();
    }

    if (action.kind === "link") {
      routeToLink(action);
      return;
    }

    if (action.kind === "faq") {
      answerFaq(action.question);
      return;
    }

    if (action.kind === "choice") {
      applyGuidedChoice(action.step, action.value, action.label);
      return;
    }

    if (action.value === "diagnose") {
      startGuidedFlow();
      return;
    }

    if (action.value === "free_audit") {
      showScannerRoute();
      return;
    }

    if (action.value === "strategy_call") {
      openBookingUrlAfterClose(STRATEGY_CALL_URL);
      return;
    }

    if (action.value === "faq") {
      showFaq();
      return;
    }
  }

  async function submitFreeText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || isThinking) return;

    setInput("");

    if (flowStep) {
      const matchedValue = matchGuidedText(flowStep, message);

      if (typeof matchedValue === "string") {
        applyGuidedChoice(flowStep, matchedValue, message);
        return;
      }
    }

    setFlowStep(null);
    setIsThinking(true);

    const localResponse = buildZoraResponse(message, leadProfile);

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: message,
      },
    ]);

    try {
      const response = await fetch("/api/zora-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          leadProfile,
        }),
      });

      const payload = response.ok
        ? ((await response.json()) as ZoraApiResponse)
        : localResponse;
      const nextProfile = normalizeProfile(payload.leadProfile || localResponse.leadProfile);

      setLeadProfile(nextProfile);
      appendMessages([
        {
          id: createId("assistant"),
          role: "assistant",
          text: payload.reply || localResponse.reply,
          actions: actionsFromRecommendation(
            payload.recommendedActions || localResponse.recommendedActions,
          ),
        },
      ]);
    } catch {
      const nextProfile = normalizeProfile(localResponse.leadProfile);
      setLeadProfile(nextProfile);
      appendMessages([
        {
          id: createId("assistant"),
          role: "assistant",
          text: localResponse.reply,
          actions: actionsFromRecommendation(localResponse.recommendedActions),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  useEffect(() => {
    function handleDocumentClick(event: globalThis.MouseEvent) {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");

      if (!link || !isBookingUrl(link.href)) {
        return;
      }

      const isModifiedClick =
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

      if (isModifiedClick || link.hasAttribute("download")) {
        closeChatbot();
        return;
      }

      event.preventDefault();
      openBookingUrlAfterClose(link.href);
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isThinking]);

  return (
    <div className="opzix-ai-shell">
      {open && (
        <div className="opzix-ai-panel" role="dialog" aria-label="Zora AI Growth Assistant">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-dark-border pb-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                <Sparkles className="h-3.5 w-3.5" />
                Zora
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug text-primary">
                Growth Assistant
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                A quick consultant for your growth bottleneck.
              </p>
            </div>
            <button
              type="button"
              onClick={() => closeChatbot()}
              className="rounded-full border border-dark-border bg-white/5 p-2 text-muted transition-colors hover:border-brand-cyan hover:text-primary"
              aria-label="Close Zora"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {profileSummary.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profileSummary.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-[0.7rem] font-semibold text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="opzix-ai-messages mt-3 space-y-2.5 pr-1">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[92%] rounded-xl border px-3 py-2.5 text-left text-sm leading-relaxed ${
                    message.role === "user"
                      ? "border-brand-cyan/45 bg-brand-cyan/14 text-primary"
                      : "border-dark-border bg-white/[0.035] text-secondary"
                  }`}
                >
                  <p>{message.text}</p>
                </div>

                {message.actions && message.actions.length > 0 && (
                  <div className="opzix-ai-actions mt-2 flex flex-wrap gap-1.5">
                    {message.actions.map((action) => (
                      <button
                        type="button"
                        key={`${message.id}-${action.label}`}
                        onClick={() => handleAction(action)}
                        className={actionClassName(action)}
                      >
                        {action.kind === "link" && action.booking ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : action.kind === "link" ? (
                          <ArrowRight className="h-3.5 w-3.5" />
                        ) : null}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="inline-flex rounded-2xl border border-dark-border bg-white/[0.035] px-3.5 py-3 text-sm text-secondary">
                Zora is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={submitFreeText} className="opzix-ai-form mt-3 flex shrink-0 gap-2 border-t border-dark-border pt-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tell Zora what is happening..."
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-brand-cyan/25 bg-white/[0.055] px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/25"
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-brand-cyan/45 bg-brand-cyan/18 text-primary transition-all hover:border-brand-cyan hover:bg-brand-cyan/25 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message to Zora"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}

      {!open && (
        <button
          type="button"
          className="opzix-ai-button"
          onClick={toggleChatbot}
          aria-expanded={open}
          aria-label="Open Zora AI Growth Assistant"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Zora
        </button>
      )}
    </div>
  );
}
