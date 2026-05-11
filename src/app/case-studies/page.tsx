import Button from "@/components/Button";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";
import ProjectProofGrid from "@/components/ProjectProofGrid";
import Section from "@/components/Section";
import { BarChart3, Check, LayoutGrid, ServerCog } from "lucide-react";

const capabilityProof = [
  {
    title: "Integrations",
    description:
      "Planning how forms, CRM, email, ecommerce, and backend systems should pass information cleanly.",
    icon: ServerCog,
  },
  {
    title: "Dashboards",
    description:
      "Creating operational visibility around inquiries, intake, orders, requests, and follow-up status.",
    icon: LayoutGrid,
  },
  {
    title: "Tracking",
    description:
      "Improving source and conversion visibility so teams can understand what is actually working.",
    icon: BarChart3,
  },
];

export default function CaseStudies() {
  return (
    <>
      <Section bgColor="secondary" padded>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-cyan">
            Case Studies
          </p>
          <h1 className="heading-1 mb-6">
            Case Studies Built Around Real Business Systems
          </h1>
          <p className="body-lg mx-auto max-w-3xl text-secondary">
            Practical examples of improved websites, ecommerce journeys,
            inquiry flows, and operational systems without inflated claims or
            generic redesign language.
          </p>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-cyan">
              Featured Case Study
            </p>
            <h2 className="heading-2 mb-4">
              A Care Agency Growth System Built Around Inquiry, Intake, and Client Journey Clarity
            </h2>
            <p className="body-lg mx-auto text-secondary">
              This project focused on helping families understand services,
              submit better inquiries, and giving the team a clearer operational
              path for follow-up.
            </p>
          </div>

          <div className="grid items-start gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              {[
                {
                  title: "Problem",
                  points: [
                    "Families needed clearer service information before making contact.",
                    "The path from website visitor to inquiry was too easy to abandon.",
                    "Intake details and follow-up depended on manual coordination.",
                  ],
                },
                {
                  title: "System Breakdown",
                  points: [
                    "Service pages were not fully aligned with how families make care decisions.",
                    "Inquiry forms did not collect enough useful context for a strong first response.",
                    "Website flow and internal follow-up were not connected as a single client acquisition system.",
                  ],
                },
                {
                  title: "Solution",
                  points: [
                    "Reworked service presentation so families could understand fit and next steps.",
                    "Improved inquiry and intake flow so the team received more useful context.",
                    "Mapped a cleaner route from submitted inquiry to human follow-up.",
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="card p-6">
                  <h3 className="heading-3 mb-4">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.points.map((point) => (
                      <li key={point} className="flex gap-3 text-secondary">
                        <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <Button href="/case-studies/care-agency-growth" size="lg">
                Read Care Agency Case Study
              </Button>
            </div>

            <div className="card-elevated p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">
                Business Impact
              </p>
              <div className="mt-6 grid gap-4">
                {[
                  ["Clearer", "Service decision path"],
                  ["Stronger", "Client inquiry experience"],
                  ["Better", "Intake and follow-up context"],
                  ["More useful", "Operational handoff foundation"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-dark-border bg-white/[0.035] p-4">
                    <p className="text-lg font-bold text-brand-cyan">{label}</p>
                    <p className="mt-1 text-sm text-secondary">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-5 md:grid-cols-3">
            {capabilityProof.map((capability) => {
              const Icon = capability.icon;
              return (
                <div key={capability.title} className="card-elevated p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">
                    {capability.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-secondary">
                    {capability.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-cyan">
              Project Examples
            </p>
            <h2 className="heading-2 mb-4">
              Conversion-Focused Case Studies Across Industries
            </h2>
            <p className="body-lg text-secondary">
              These examples show practical work where the goal is improving
              business systems, lead flow, and customer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <CaseStudyCard
              image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
              industry="Professional Services"
              headline="Sales Coach Website & Lead Flow"
              result="Refined messaging, improved service pages, and a cleaner inquiry funnel for more qualified client conversations."
              href="/case-studies/sales-coach"
            />
            <CaseStudyCard
              image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop"
              industry="Care Services"
              headline="Care Agency Website & Client Journey"
              result="Streamlined service discovery, contact flow, and booking logic so care clients could reach out faster."
              href="/case-studies/care-agency-growth"
            />
            <CaseStudyCard
              image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"
              industry="Ecommerce"
              headline="Ecommerce System Success"
              result="A complete ecommerce system overhaul focused on clearer conversion paths, more reliable order flow, and better analytics."
              href="/case-studies/ecommerce-system-success"
            />
          </div>
        </div>
      </Section>

      <ProjectProofGrid />

      <CTASection
        headline="Want to Improve Your Customer Journey?"
        subheadline="Book a strategy call and let us map the highest-impact improvements for your website, customer journey, and operations."
        buttonLabel="Book Strategy Call"
        buttonHref="/contact?source=services"
      />
    </>
  );
}
