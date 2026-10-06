import { Mail, MessageCircle, Phone } from "lucide-react";
import { brittanySiteConfig } from "@/content/brittany";

export default function HomesUnavailable() {
  return (
    <section className="hero-atmosphere border-t border-dark-border py-20">
      <div className="container-wide">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Homes
          </p>
          <h1 className="heading-1 mt-4">Find Your Next Home</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-secondary">
            {brittanySiteConfig.agentFirstName}'s home search is being
            prepared. Call, text, or email {brittanySiteConfig.agentFirstName}{" "}
            and she can help you find the right homes now.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a href={`tel:${brittanySiteConfig.phoneTel}`} className="btn-primary">
              <Phone className="mr-2 h-5 w-5" />
              Call {brittanySiteConfig.agentFirstName}
            </a>
            <a
              href={`sms:${brittanySiteConfig.phoneTel}`}
              className="btn-secondary"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Text {brittanySiteConfig.agentFirstName}
            </a>
            <a href={`mailto:${brittanySiteConfig.email}`} className="btn-secondary">
              <Mail className="mr-2 h-5 w-5" />
              Contact {brittanySiteConfig.agentFirstName}
            </a>
          </div>
          <p className="mt-5 text-sm font-semibold text-muted">
            {brittanySiteConfig.phoneDisplay}
          </p>
        </div>
      </div>
    </section>
  );
}
