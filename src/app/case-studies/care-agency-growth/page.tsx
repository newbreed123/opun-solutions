import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import {
  BarChart3,
  Check,
  ClipboardList,
  Heart,
  LayoutGrid,
  MessageSquare,
  Route,
} from "lucide-react";

const problemPoints = [
  "Families needed clearer service information before reaching out",
  "The path from website visitor to inquiry was too easy to abandon",
  "Intake questions were not structured around the real decision journey",
  "Follow-up depended too much on manual coordination",
  "The online experience did not fully reflect the care and professionalism of the agency",
];

const improvements = [
  {
    title: "Clearer Service Presentation",
    description:
      "Reframed service pages so families could understand care options, fit, and next steps without searching through dense content.",
    icon: Heart,
  },
  {
    title: "Better Inquiry Flow",
    description:
      "Created a stronger path from landing on the site to submitting the right details for a useful conversation.",
    icon: MessageSquare,
  },
  {
    title: "Structured Intake Experience",
    description:
      "Organized intake questions around care needs, timing, location, and preferred follow-up so the team could respond with context.",
    icon: ClipboardList,
  },
  {
    title: "Operational Handoff",
    description:
      "Mapped how inquiries should move from the website into team review, response, and follow-up without losing important details.",
    icon: Route,
  },
];

const systemBuilt = [
  "Service pages with clearer decision support",
  "Inquiry and intake flow for families",
  "Lead routing logic for internal follow-up",
  "Trust-focused page structure and calls to action",
  "Mobile-first journey for families researching care",
  "Measurement foundation for inquiry visibility",
];

const lessons = [
  "Care decisions require clarity before persuasion",
  "Small intake improvements can reduce back-and-forth for families and staff",
  "A website should support the real operating process, not sit outside it",
  "AI and automation are most useful when they make human follow-up easier",
];

export default function CareAgencyGrowthCaseStudy() {
  return (
    <>
      <Section bgColor="secondary">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Care Agency Case Study
            </p>
            <h1 className="heading-1 mb-6 w-[calc(100vw-2rem)] md:w-auto">
              <span className="block">Care Agency Inquiry</span>
              <span className="block">and Intake System</span>
            </h1>
            <p className="body-lg mb-8 max-w-[32ch] text-secondary md:max-w-2xl">
              <span className="block">How Opzix helped improve</span>
              <span className="block">a care agency's inquiry flow,</span>
              <span className="block">intake experience, and path to inquiry.</span>
            </p>
            <Button href="/contact" size="lg">
              Book Strategy Call
            </Button>
          </div>

          <div className="card-elevated w-[calc(100vw-2rem)] p-6 md:w-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Journey Snapshot
            </p>
            <div className="mt-6 space-y-4">
              {[
                ["Visitor need", "Understand care options and trust the agency"],
                ["Digital friction", "Unclear path to submit the right inquiry"],
                ["System focus", "Service clarity, intake, routing, follow-up"],
                ["Outcome", "A stronger path from visitor to client inquiry"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-dark-border bg-white/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-primary sm:text-base">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              The Problem
            </p>
            <h2 className="heading-2 mt-4">
              Families Needed Confidence Before They Were Ready to Inquire
            </h2>
            <p className="body-lg mt-5 text-secondary">
              Care agency visitors often arrive with urgency, emotion, and a
              lot of questions. If services, next steps, or intake expectations
              are unclear, families may delay reaching out or contact the team
              without the right information.
            </p>
          </div>
          <div className="grid gap-4">
            {problemPoints.map((point) => (
              <div key={point} className="card flex gap-3 p-5">
                <Check className="mt-1 h-5 w-5 flex-none text-brand-cyan" />
                <p className="font-semibold text-primary">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            The Real Issue
          </p>
          <h2 className="heading-2 mt-4">
            This Was Not Just a Website Issue. It Was a Client Journey Issue.
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            The website needed to explain services, build trust, capture useful
            context, and support internal follow-up. The goal was to make the
            digital journey feel calmer and more organized for families while
            giving the team better inquiry information.
          </p>
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            What We Improved
          </p>
          <h2 className="heading-2 mt-4">
            A Clearer Path From Visitor to Inquiry
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {improvements.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-elevated p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-primary">{item.title}</h3>
                <p className="mt-4 leading-relaxed text-secondary">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Before / After
          </p>
          <h2 className="heading-2 mt-4">Client Journey Before and After</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="heading-4 mb-5 text-red-200">Before</h3>
            <div className="space-y-3 text-secondary">
              {[
                "Services were harder to compare",
                "Inquiry path required more effort from families",
                "Team had less context before responding",
                "Follow-up was more manual",
              ].map((item) => (
                <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div className="card-elevated p-6">
            <h3 className="heading-4 mb-5 text-brand-cyan">After</h3>
            <div className="space-y-3">
              {[
                "Services were presented around family decision needs",
                "Inquiry flow made the next step clearer",
                "Intake captured more useful context",
                "Team follow-up had a stronger operational path",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 px-4 py-3 text-primary">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              System Built
            </p>
            <h2 className="heading-2 mt-4">
              A Digital Intake System That Supports Human Care
            </h2>
            <p className="body-lg mt-5 text-secondary">
              The system was designed to help families understand options and
              help the agency respond with better context. It supports the team
              rather than trying to replace the human care conversation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {systemBuilt.map((item) => (
              <div key={item} className="rounded-2xl border border-dark-border bg-white/[0.035] p-4">
                <Check className="mb-3 h-5 w-5 text-brand-cyan" />
                <p className="font-semibold text-primary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Business Impact
            </p>
            <h2 className="heading-2 mt-4">
              More Clarity, Better Intake, Stronger Path to Inquiry
            </h2>
            <p className="body-lg mt-5 text-secondary">
              The project helped improve how prospective clients moved through
              the digital journey. Families had a clearer understanding of the
              services, and the agency had a more organized foundation for
              inquiry handling and follow-up.
            </p>
          </div>
          <div className="card-elevated p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Operational View
            </p>
            <div className="mt-6 space-y-4">
              {[
                ["Service clarity", "Easier for families to understand fit"],
                ["Intake quality", "Better context before first response"],
                ["Team workflow", "Cleaner inquiry handling path"],
                ["Conversion journey", "Stronger route from visitor to inquiry"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-primary">{label}</p>
                    <BarChart3 className="h-5 w-5 text-brand-cyan" />
                  </div>
                  <p className="mt-2 text-sm text-secondary">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Lessons Learned
          </p>
          <h2 className="heading-2 mt-4">
            What This Project Reinforced
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2">
          {lessons.map((lesson) => (
            <div key={lesson} className="card p-6">
              <LayoutGrid className="mb-4 h-8 w-8 text-brand-cyan" />
              <p className="font-semibold leading-relaxed text-primary">
                {lesson}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <CTASection
        headline="Want to Improve Your Client Inquiry System?"
        subheadline="Book a strategy call and we will map where your service presentation, intake flow, and follow-up journey can become clearer."
        buttonLabel="Book Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
