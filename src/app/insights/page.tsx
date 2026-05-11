import Button from "@/components/Button";
import CTASection from "@/components/CTASection";
import Section from "@/components/Section";
import { BarChart3, Check, MessageSquare, ShoppingCart } from "lucide-react";

const articles = [
  {
    title: "Why Most Ecommerce Stores Don't Have a Traffic Problem",
    lines: ["Why Most Ecommerce Stores", "Don't Have a Traffic Problem"],
    description:
      "A practical look at why many stores need better systems before they need more visitors.",
    href: "/insights/ecommerce-traffic-vs-systems",
    icon: ShoppingCart,
  },
  {
    title: "What Breaks After Checkout: The Hidden Ecommerce Operations Problem",
    lines: ["What Breaks After Checkout:", "The Hidden Operations Problem"],
    description:
      "What happens after a customer pays, and why fulfillment, fraud review, and tracking matter.",
    href: "/insights/what-breaks-after-checkout",
    icon: BarChart3,
  },
  {
    title: "Why Most AI Chatbots Fail — And How to Build One That Actually Helps",
    lines: ["Why Most AI Chatbots Fail", "And How to Build One That Helps"],
    description:
      "Why chatbots underperform when they are treated as popups instead of workflow systems.",
    href: "/insights/why-ai-chatbots-fail",
    icon: MessageSquare,
  },
];

export default function InsightsIndex() {
  return (
    <>
      <Section bgColor="secondary">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-brand-cyan">
            Insights
          </p>
          <h1 className="heading-1 mb-6">
            <span className="block">Practical Thinking</span>
            <span className="block">for Ecommerce, AI,</span>
            <span className="block">Business Systems</span>
          </h1>
          <p className="body-lg mx-auto text-secondary">
            Educational resources for business owners who want better customer
            journeys, stronger operations, and more useful digital systems.
          </p>
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="grid gap-6 lg:grid-cols-3">
          {articles.map((article) => {
            const Icon = article.icon;
            return (
              <article key={article.href} className="card-elevated p-7">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="heading-4 mb-4" aria-label={article.title}>
                  {article.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <p className="body-md mb-6 text-secondary">
                  {article.description}
                </p>
                <Button href={article.href} variant="secondary">
                  Read Insight
                </Button>
              </article>
            );
          })}
        </div>
      </Section>

      <Section bgColor="deep">
        <div className="mx-auto max-w-4xl text-center">
          <Check className="mx-auto mb-5 h-10 w-10 text-brand-cyan" />
          <h2 className="heading-2 mb-4">
            Want to Turn These Ideas Into a System?
          </h2>
          <p className="body-lg mx-auto mb-8 text-secondary">
            Opun can review your current website, ecommerce workflow,
            automation, and tracking foundation.
          </p>
          <Button href="/contact" size="lg">
            Book Strategy Call
          </Button>
        </div>
      </Section>

      <CTASection
        headline="Need a Clearer Growth System?"
        subheadline="Book a strategy call and we will map the highest-impact improvements for your customer journey."
        buttonLabel="Book Strategy Call"
        buttonHref="/contact"
      />
    </>
  );
}
