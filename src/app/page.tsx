import Section from "@/components/Section";
import ServiceCard from "@/components/ServiceCard";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";
import Button from "@/components/Button";
import {
  Globe,
  MessageSquare,
  BarChart3,
  ShoppingCart,
  Zap,
  Settings,
  Check,
} from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Premium Hero Section */}
      <section className="bg-dark-bg pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* LEFT SIDE */}
            <div>
              <h1 className="heading-1 mb-6 leading-tight">
                Your Website Isn’t the Problem —{" "}
                <span className="gradient-text">Your System Is</span>
              </h1>

              <p className="body-lg text-secondary mb-8">
                We build ecommerce and service business systems that fix
                conversion issues, automate operations, and help you scale
                without chaos.
              </p>

              {/* Trust Points */}
              <div className="space-y-3 mb-10">
                <div className="flex items-center gap-3">
                  <Check size={20} className="text-brand-blue" />
                  <span className="body-md">Fix low conversion rates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={20} className="text-brand-blue" />
                  <span className="body-md">Automate manual operations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={20} className="text-brand-blue" />
                  <span className="body-md">
                    Connect your systems end-to-end
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-4 flex-wrap">
                <Button href="/contact" variant="primary" size="lg">
                  Book Free Strategy Call
                </Button>

                <Button
                  href="/solutions/ecommerce"
                  variant="secondary"
                  size="lg"
                >
                  Explore Ecommerce Systems
                </Button>
              </div>
            </div>

            {/* RIGHT SIDE - VISUAL CARD */}
            <div className="card-elevated">
              <h3 className="heading-4 mb-6 text-brand-blue">What We Build</h3>

              <div className="space-y-4">
                {[
                  {
                    title: "High-Converting Websites",
                    desc: "Fast, mobile-first, SEO-optimized",
                  },
                  {
                    title: "Ecommerce Systems",
                    desc: "Checkout optimization, fraud prevention",
                  },
                  {
                    title: "AI Assistants",
                    desc: "24/7 lead capture & qualification",
                  },
                  {
                    title: "Client Dashboards",
                    desc: "Real-time portals & automation",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="pb-4 border-b border-dark-tertiary last:border-b-0"
                  >
                    <p className="font-semibold text-primary mb-1">
                      {item.title}
                    </p>
                    <p className="body-sm text-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Problem Section */}
      <Section bgColor="secondary" padded={true}>
        <h3 className="heading-4 mb-6 text-brand-blue">
          Most businesses we work with struggle with:
        </h3>

        <div className="space-y-4">
          {[
            "Low conversion rates",
            "Manual order & customer handling",
            "Poor tracking and unclear performance",
            "Disconnected tools and workflows",
          ].map((item, i) => (
            <div key={i} className="pb-3 border-b border-dark-tertiary">
              <p className="body-md text-primary">{item}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4 mb-6 mt-12">
          <h2 className="heading-2 mb-6">
            Most Businesses Don’t Have a Website Problem
          </h2>
          <p className="body-lg mb-6 text-secondary">
            Leads aren’t captured properly. Checkout flows leak revenue.
            Operations are manual and disconnected. That’s why growth feels
            inconsistent — even when traffic is there.
          </p>
        </div>
      </Section>

      {/* Solution Section */}
      <Section bgColor="primary" padded={true}>
        <div className="mb-12">
          <h2 className="heading-2 text-center mb-4">
            {" "}
            Complete Systems — Not Just Websites
          </h2>
          <p className="body-lg text-center text-secondary mt-2">
            Most clients come to us thinking they need a new website. What they
            actually need is a better system.
          </p>
          <p className="body-lg text-center text-secondary max-w-2xl mx-auto">
            Complete digital systems that turn your website into a
            lead-generating, revenue-driving business engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card-elevated">
            <div className="mb-4">
              <Globe className="w-12 h-12 text-brand-blue" />
            </div>
            <h3 className="heading-4 mb-3">High-Converting Websites</h3>
            <p className="body-md">
              Modern, fast websites optimized for conversions. SEO-ready,
              mobile-first, designed to capture leads and guide customers to
              action.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card-elevated">
            <div className="mb-4">
              <MessageSquare className="w-12 h-12 text-brand-blue" />
            </div>
            <h3 className="heading-4 mb-3">AI Lead Assistants</h3>
            <p className="body-md">
              24/7 AI chatbots that qualify leads, answer questions, and book
              appointments. Never miss a customer again.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-elevated">
            <div className="mb-4">
              <Zap className="w-12 h-12 text-brand-blue" />
            </div>
            <h3 className="heading-4 mb-3">Ecommerce Systems</h3>
            <p className="body-md">
              Stores, checkout flows, fraud prevention, shipping workflows, and
              backend integrations built from real operational experience.
            </p>
          </div>
        </div>
      </Section>

      <Section bgColor="secondary" padded={true}>
        <div className="mb-12 text-center">
          <h2 className="heading-2 mb-4">What Are You Trying to Improve?</h2>
          <p className="body-lg text-secondary">
            We build different systems depending on your business model.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-elevated">
            <h3 className="heading-4 mb-3">Ecommerce Growth Systems</h3>
            <p className="body-md mb-6 text-secondary">
              Improve conversion rates, fix checkout issues, and scale your
              operations with better backend systems.
            </p>
            <Button href="/solutions/ecommerce" variant="secondary">
              Explore Ecommerce →
            </Button>
          </div>

          <div className="card-elevated">
            <h3 className="heading-4 mb-3">Lead Generation Systems</h3>
            <p className="body-md mb-6 text-secondary">
              Capture more leads, automate follow-ups, and improve your sales
              pipeline with smarter systems.
            </p>
            <Button href="/services" variant="secondary">
              Explore Services →
            </Button>
          </div>
        </div>
      </Section>
      {/* Ecommerce Focus Section */}
      <Section bgColor="secondary" padded={true}>
        <div className="bg-dark-tertiary border border-white/10 rounded-2xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="mb-6">
              Ecommerce Systems Built From Real Operational Experience
            </h2>

            <p className="text-secondary mb-6">
              We don’t just build ecommerce websites — we understand how they
              operate. From checkout flows and fraud prevention to shipping and
              backend systems, we build ecommerce solutions that actually work
              in real businesses.
            </p>

            <ul className="space-y-2 text-secondary">
              <li>✔ Ecommerce website development</li>
              <li>✔ Checkout optimization</li>
              <li>✔ Fraud prevention systems</li>
              <li>✔ Shipping & fulfillment workflows</li>
              <li>✔ NetSuite & backend integrations</li>
            </ul>
          </div>

          {/* RIGHT SIDE VISUAL */}
          <div className="bg-dark-secondary border border-white/10 rounded-xl p-6">
            <h3 className="mb-4 font-bold">What This Means</h3>

            <div className="space-y-3 text-secondary">
              <p>• Fewer failed or fraudulent orders</p>
              <p>• Smoother checkout experience</p>
              <p>• Better fulfillment workflows</p>
              <p>• Systems that scale with your business</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Services Section */}
      <Section bgColor="primary" padded={true}>
        <div className="mb-12">
          <h2 className="heading-2 text-center mb-4">What We Offer</h2>
          <p className="body-lg text-center text-secondary max-w-2xl mx-auto">
            A complete suite of services to grow your business digitally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            icon={Globe}
            title="Website Design & Development"
            description="High-performance, conversion-focused websites built with modern tech. Mobile-responsive, fast, and SEO-optimized."
            href="/services"
          />
          <ServiceCard
            icon={ShoppingCart}
            title="Ecommerce Setup"
            description="Complete ecommerce systems with payment integration, inventory management, and fulfillment workflows."
            href="/services"
          />
          <ServiceCard
            icon={MessageSquare}
            title="AI Chatbots"
            description="Smart AI assistants that qualify leads, book appointments, and handle customer support 24/7."
            href="/services"
          />
          <ServiceCard
            icon={BarChart3}
            title="Google Ads & Conversion Tracking"
            description="Data-driven ad campaigns with proper tracking, optimization, and conversion measurement."
            href="/services"
          />
          <ServiceCard
            icon={Zap}
            title="Client Portals & Dashboards"
            description="Custom portals for clients to view progress, payments, schedules, and project updates in real-time."
            href="/services"
          />
          <ServiceCard
            icon={Settings}
            title="Business Integrations"
            description="NetSuite, Zapier, payment processors, and custom integrations. We connect your systems to work together seamlessly."
            href="/services"
          />
        </div>

        <div className="text-center border-t border-dark-tertiary pt-12 mt-12">
          <Button href="/services" size="lg" variant="primary">
            View All Services
          </Button>
        </div>
      </Section>

      <Section bgColor="primary" padded={true}>
        <div className="text-center mb-12">
          <h2 className="heading-2 mb-4">Real Results from Real Systems</h2>
          <p className="body-lg text-secondary">
            These aren’t redesigns — they’re system-level improvements.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="heading-3 text-brand-blue">3x</p>
            <p className="body-sm text-muted">More qualified leads</p>
          </div>
          <div>
            <p className="heading-3 text-brand-blue">60%</p>
            <p className="body-sm text-muted">Less manual work</p>
          </div>
          <div>
            <p className="heading-3 text-brand-blue">5x</p>
            <p className="body-sm text-muted">Revenue growth</p>
          </div>
          <div>
            <p className="heading-3 text-brand-blue">98%</p>
            <p className="body-sm text-muted">Client satisfaction</p>
          </div>
        </div>
      </Section>
      {/* Case Studies Preview */}
      <Section bgColor="secondary" padded={true}>
        <div className="mb-12">
          <h2 className="heading-2 text-center mb-4">
            How We Help Businesses Grow
          </h2>
          <p className="body-lg text-center text-secondary max-w-2xl mx-auto">
            Real examples of businesses that improved their digital presence and
            operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"
            industry="Professional Services"
            headline="Sales Coach Website Improved Lead Flow"
            result="Redesigned website + AI assistant led to better qualified inquiries and improved conversion tracking."
            href="/case-studies/sales-coach"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=300&fit=crop"
            industry="Healthcare"
            headline="Care Agency Streamlined Booking Process"
            result="Client portal + chatbot automation reduced manual booking work and improved customer satisfaction."
            href="/case-studies/care-agency"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop"
            industry="Ecommerce"
            headline="Online Store Supported with Better Operations"
            result="Optimized ecommerce system + Google Ads integration improved revenue and reduced operational friction."
            href="/case-studies/ecommerce-ops"
          />
        </div>

        <div className="text-center border-t border-dark-tertiary pt-12 mt-12">
          <Button href="/case-studies" size="lg" variant="secondary">
            See More Case Studies
          </Button>
        </div>
      </Section>

      {/* Final CTA */}
      <CTASection
        headline="Ready to transform your business?"
        subheadline="Let's discuss how we can help you capture more leads, run smoother operations, and sell online."
        buttonLabel="Start Your Project"
        buttonHref="/contact"
      />
    </>
  );
}
