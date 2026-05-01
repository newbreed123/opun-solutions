import HeroSection from "@/components/HeroSection";
import Section from "@/components/Section";
import CaseStudyCard from "@/components/CaseStudyCard";
import CTASection from "@/components/CTASection";

export default function CaseStudies() {
  return (
    <>
      {/* Hero */}
      <HeroSection
        headline="Case Studies"
        subheadline="See how we've helped businesses transform their digital presence and grow faster."
      />

      {/* Case Studies Grid */}
      <Section bgColor="primary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"
            industry="Professional Services"
            headline="Sales Coach Website Increased Qualified Leads by 3x"
            result="Redesigned website + AI assistant led to 3x more qualified inquiries and improved conversion tracking."
            href="/case-studies/sales-coach"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=300&fit=crop"
            industry="Healthcare"
            headline="Care Agency Streamlined Booking & Doubled Response Time"
            result="Client portal + chatbot automation reduced booking time by 60% and improved customer satisfaction."
            href="/case-studies/care-agency"
          />
          <CaseStudyCard
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"
            industry="Ecommerce"
            headline="Online Store Scaled to 5x Revenue in 12 Months"
            result="Optimized ecommerce system + Google Ads integration achieved 5x revenue growth and reduced cart abandonment by 35%."
            href="/case-studies/ecommerce-ops"
          />
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        headline="Ready to see similar results?"
        subheadline="Let's discuss how we can help your business grow faster."
        buttonLabel="Book a Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
