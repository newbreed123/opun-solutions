import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import CaseStudyCard from "@/components/CaseStudyCard";
import Section from "@/components/Section";
import ServiceCard from "@/components/ServiceCard";
import {
  AuditPreviewMockup,
  ChatbotPreviewMockup,
  FunnelArchitectureDiagram,
  LeadSystemDashboardMockup,
  OperationsDashboardMockup,
  WorkflowMapMockup,
} from "@/components/VisualMockups";
import {
  BarChart3,
  Check,
  Globe,
  LayoutGrid,
  MessageSquare,
  ServerCog,
  Settings,
  ShoppingCart,
  Zap,
} from "lucide-react";

const trustPoints = [
  "Ecommerce operations experience",
  "AI + automation systems",
  "Conversion-focused builds",
  "Backend integration thinking",
];

const systemNodes = [
  { label: "Website", icon: Globe },
  { label: "Ecommerce storefront", icon: ShoppingCart },
  { label: "AI assistant", icon: MessageSquare },
  { label: "CRM / email", icon: ServerCog },
  { label: "Booking / intake", icon: Check },
  { label: "Analytics / tracking", icon: BarChart3 },
  { label: "Backend integrations", icon: Settings },
  { label: "Client dashboard", icon: LayoutGrid },
  { label: "Support / ticket flow", icon: Zap },
];

const typicalAgency = [
  "Focuses mostly on design",
  "Builds generic websites",
  "Leaves systems disconnected",
  "Offers limited operational thinking",
];

const opunDifference = [
  "Builds around real operations",
  "Creates conversion-focused systems",
  "Connects website, AI, automation, and backend workflows",
  "Thinks beyond launch",
];

function SystemsMap() {
  return (
    <div className="relative mx-auto mt-12 max-w-6xl">
      <div className="absolute inset-x-8 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent lg:block" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {systemNodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div
              key={node.label}
              className={`card relative p-5 ${index === 4 ? "lg:scale-105 lg:border-brand-cyan/60" : ""}`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-primary">{node.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Connected into the same customer and operations flow.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero-atmosphere py-14 sm:py-16 md:py-24">
        <div className="container-wide">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="min-w-0">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
                Systems-focused agency
              </p>
              <h1 className="heading-1 mb-6">
                <span className="block">Business Systems for</span>
                <span className="block">Leads, Sales, and</span>
                <span className="block">Operational Control</span>
              </h1>
              <p className="body-lg mb-8 text-secondary">
                Opun builds more than websites. We create conversion-focused
                ecommerce systems, AI assistants, automation workflows,
                dashboards, integrations, and customer journeys that help your
                team sell better and operate with more control.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/contact?source=homepage" variant="primary" size="lg">
                  Book Strategy Call
                </Button>
                <Button href="/services/ecommerce-solutions" variant="secondary" size="lg">
                  Explore Ecommerce Systems
                </Button>
              </div>
            </div>
            <LeadSystemDashboardMockup />
          </div>

          <div className="mt-12 grid gap-3 border-t border-dark-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-sm text-secondary">
                <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section bgColor="secondary">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Systems We Build
          </p>
          <h2 className="heading-2 mt-4">
            The Website Is Only One Part of the Growth System
          </h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            We connect the customer-facing experience with the operational
            workflows behind it so leads, orders, support requests, and data
            move cleanly.
          </p>
        </div>
        <SystemsMap />
        <div className="mt-10 text-center">
          <Button href="/contact?source=homepage" size="lg">
            Book Strategy Call
          </Button>
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
              Why Opun Is Different
            </p>
            <h2 className="heading-2 mt-4">
              Built for Businesses That Need More Than a Pretty Website
            </h2>
            <p className="body-lg mt-5 text-secondary">
              A modern customer journey touches your website, AI assistant,
              CRM, booking flow, ecommerce stack, tracking, and internal team.
              We design around that full path.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="heading-4 mb-5 text-red-200">Typical Agency</h3>
              <div className="space-y-3">
                {typicalAgency.map((item) => (
                  <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-secondary">
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="card-elevated p-6 lg:-mt-5">
              <h3 className="heading-4 mb-5 text-brand-cyan">Opun</h3>
              <div className="space-y-3">
                {opunDifference.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 px-4 py-3 text-sm text-primary">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-brand-cyan" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Button href="/contact?source=homepage" size="lg">
            Book Strategy Call
          </Button>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Visual System Proof
          </p>
          <h2 className="heading-2 mt-4">
            Visual Workflows That Make Business Systems Easier to Understand
          </h2>
          <p className="body-lg mt-5 text-secondary">
            We use dashboard-style UI, lead flow diagrams, ecommerce audit
            previews, and AI assistant mockups to make complex operations
            visible before they become expensive problems.
          </p>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <FunnelArchitectureDiagram />
          <div className="grid gap-5">
            <AuditPreviewMockup />
            <ChatbotPreviewMockup />
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <OperationsDashboardMockup />
          <WorkflowMapMockup />
        </div>
      </Section>

      <Section bgColor="secondary">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Core Services
          </p>
          <h2 className="heading-2 mt-4">Business Systems for Modern Growth</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={Globe}
            title="Website Design & Development"
            description="Conversion-focused websites with clear messaging, fast performance, and a stronger path to inquiry."
            href="/services"
          />
          <ServiceCard
            icon={ShoppingCart}
            title="Ecommerce Systems"
            description="Storefront, checkout, fulfillment, tracking, and backend workflows designed around real operations."
            href="/services/ecommerce-solutions"
          />
          <ServiceCard
            icon={MessageSquare}
            title="AI & Automation"
            description="AI assistants that answer questions, qualify leads, route inquiries, and support human follow-up."
            href="/services/ai-chatbots-automation"
          />
          <ServiceCard
            icon={BarChart3}
            title="Tracking & Analytics"
            description="Measurement foundations that help you see which journeys, campaigns, and workflows are working."
            href="/services"
          />
          <ServiceCard
            icon={LayoutGrid}
            title="Dashboards & Portals"
            description="Internal and client-facing interfaces for status, intake, documents, requests, and performance visibility."
            href="/services"
          />
          <ServiceCard
            icon={Settings}
            title="Integrations"
            description="CRM, email, booking, ecommerce, payments, ERP, and automation workflows connected with intent."
            href="/services"
          />
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Case Study Foundation
          </p>
          <h2 className="heading-2 mt-4">How We Help Businesses Improve the Journey</h2>
          <p className="body-lg mx-auto mt-5 text-secondary">
            No inflated claims. Just practical improvements to inquiry flow,
            operations, and customer experience.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"
            industry="Professional Services"
            headline="Sales Coach Website Improved Lead Flow"
            result="A clearer website and inquiry path helped improve prospect quality and conversion visibility."
            href="/case-studies/sales-coach"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=300&fit=crop"
            industry="Care Agency"
            headline="Care Agency Growth System"
            result="A stronger inquiry, intake, and service presentation foundation for care agency growth."
            href="/case-studies/care-agency-growth"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop"
            industry="Ecommerce"
            headline="Ecommerce System Success"
            result="A stronger storefront, checkout, and operations system built to reduce friction."
            href="/case-studies/ecommerce-system-success"
          />
        </div>
      </Section>

      <CTASection
        headline="Ready to Build a Business System That Converts?"
        subheadline="Book a strategy call and we will map where your website, ecommerce flow, AI assistant, automation, and operations can work better together."
        buttonLabel="Book Strategy Call"
        buttonHref="/contact?source=homepage"
      />
    </>
  );
}
