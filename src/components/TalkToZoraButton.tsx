"use client";

import Button from "@/components/Button";
import { trackEvent } from "@/lib/analytics";

const ZORA_OPEN_EVENT = "opzix:zora-open";

export default function TalkToZoraButton() {
  function openZora() {
    trackEvent("zora_cta_clicked", {
      sourceArea: "ai_business_assistants_final_cta",
    });

    window.dispatchEvent(
      new CustomEvent(ZORA_OPEN_EVENT, {
        detail: {
          source: "ai_business_assistants_page",
        },
      }),
    );
  }

  return (
    <Button variant="secondary" size="lg" onClick={openZora}>
      Talk to Zora
    </Button>
  );
}
