"use client";

import { MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Check, MessageSquare, X } from "lucide-react";

const prompts = [
  {
    question: "How can Opzix help my business?",
    response:
      "We look at your website, customer journey, and operations, then map the systems that would help you capture leads, sell online, and reduce manual work.",
  },
  {
    question: "Do you work with Shopify?",
    response:
      "Yes. We help with Shopify storefronts, product structure, checkout flow, conversion tracking, and operational workflows around orders and fulfillment.",
  },
  {
    question: "Can you help with NetSuite integrations?",
    response:
      "We can help plan and support backend integration workflows, including how ecommerce, CRM, ERP, email, and dashboards should pass information between systems.",
  },
  {
    question: "Can you build an AI chatbot for my website?",
    response:
      "Yes. We build website assistants that answer common questions, qualify prospects, collect details, route inquiries, and hand off to your team when needed.",
  },
  {
    question: "Can I book an audit?",
    response:
      "Yes. For ecommerce projects, you can book a focused audit. For broader systems work, book a strategy call and we will map the best starting point.",
  },
];

const CHATBOT_STATE_KEY = "opzix-ai-chatbot-state";
const BOOKING_LINK_DELAY_MS = 150;

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

export default function OpzixAIAssistant() {
  const [open, setOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState(prompts[0]);

  function persistChatbotState(nextState: "open" | "closed") {
    try {
      window.localStorage.setItem(CHATBOT_STATE_KEY, nextState);
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
  }

  function closeChatbot({ persist = true } = {}) {
    setOpen(false);
    setActivePrompt(prompts[0]);

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

  function handleBookingLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    openBookingUrlAfterClose(event.currentTarget.href);
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

  return (
    <div className="opzix-ai-shell">
      {open && (
        <div className="opzix-ai-panel" role="dialog" aria-label="Ask Opzix AI">
          <div className="flex items-start justify-between gap-4 border-b border-dark-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-cyan">
                Opzix AI Preview
              </p>
              <h2 className="mt-2 text-lg font-bold text-primary">
                Ask about systems, ecommerce, or automation
              </h2>
            </div>
            <button
              type="button"
              onClick={() => closeChatbot()}
              className="rounded-full border border-dark-border bg-white/5 p-2 text-muted transition-colors hover:border-brand-cyan hover:text-primary"
              aria-label="Close Ask Opzix AI"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-dark-border bg-white/[0.035] p-4">
            <p className="text-sm font-semibold text-primary">
              {activePrompt.question}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              {activePrompt.response}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            {prompts.map((prompt) => (
              <button
                type="button"
                key={prompt.question}
                onClick={() => setActivePrompt(prompt)}
                className={`rounded-2xl border px-3 py-2 text-left text-sm transition-all ${
                  activePrompt.question === prompt.question
                    ? "border-brand-cyan/70 bg-brand-blue/15 text-primary"
                    : "border-dark-border bg-white/[0.025] text-secondary hover:border-brand-blue/60 hover:text-primary"
                }`}
              >
                {prompt.question}
              </button>
            ))}
          </div>

          <Link
            href="/contact?source=ai-chatbot"
            onClick={handleBookingLinkClick}
            className="btn btn-primary mt-5 w-full"
          >
            <Check className="mr-2 h-4 w-4" />
            Book Strategy Call
          </Link>
        </div>
      )}

      <button
        type="button"
        className="opzix-ai-button"
        onClick={toggleChatbot}
        aria-expanded={open}
        aria-label="Open Ask Opzix AI"
      >
        <MessageSquare className="h-4 w-4" />
        Ask Opzix AI
      </button>
    </div>
  );
}
