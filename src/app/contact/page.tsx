"use client";

import { useState } from "react";
import Section from "@/components/Section";
import Button from "@/components/Button";
import { Check, X, ShoppingCart, Zap } from "lucide-react";

export default function Contact() {
  const [serviceType, setServiceType] = useState<"audit" | "services" | null>(
    null,
  );
  const [auditFormState, setAuditFormState] = useState({
    name: "",
    email: "",
    website: "",
    businessType: "ecommerce",
    revenue: "",
    biggestIssue: "",
    runningAds: "",
  });

  const [servicesFormState, setServicesFormState] = useState({
    name: "",
    email: "",
    businessType: "",
    serviceNeeded: "",
    projectDescription: "",
  });

  const [auditSubmitted, setAuditSubmitted] = useState(false);
  const [servicesSubmitted, setServicesSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setAuditFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleServicesChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setServicesFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ecommerce-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...auditFormState,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setFormError(
          data.error ||
            "There was an error submitting your audit request. Please try again.",
        );
        return;
      }

      setAuditSubmitted(true);
      setSuccessMessage(
        data.message || "Thanks! We received your audit request.",
      );
      setAuditFormState({
        name: "",
        email: "",
        website: "",
        businessType: "ecommerce",
        revenue: "",
        biggestIssue: "",
        runningAds: "",
      });
    } catch (error) {
      console.error("Error submitting audit form:", error);
      setFormError(
        "There was an error submitting your audit request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleServicesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...servicesFormState,
          service: servicesFormState.serviceNeeded,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setFormError(
          data.error ||
            "There was an error submitting your inquiry. Please try again.",
        );
        return;
      }

      setServicesSubmitted(true);
      setSuccessMessage(
        data.message || "Thanks! We'll get back to you shortly.",
      );
      setServicesFormState({
        name: "",
        email: "",
        businessType: "",
        serviceNeeded: "",
        projectDescription: "",
      });
    } catch (error) {
      console.error("Error submitting services form:", error);
      setFormError(
        "There was an error submitting your inquiry. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-dark-bg py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl">
            <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
              Get Started
            </p>
            <h1 className="heading-1 mb-6 leading-tight">
              Start Your Project or Book an Ecommerce Audit
            </h1>

            <p className="body-lg text-secondary mb-8">
              Whether you need a free audit or want to explore our services,
              tell us what you're looking for.
            </p>
          </div>
        </div>
      </section>

      {/* Service Selection */}
      {!serviceType && (
        <Section bgColor="secondary" padded={true}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="heading-2 mb-4">What do you need help with?</h2>
              <p className="body-lg text-secondary max-w-2xl mx-auto">
                Choose your path and tell us about your project
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Card 1: Ecommerce Audit */}
              <button
                onClick={() => {
                  setFormError("");
                  setSuccessMessage("");
                  setAuditSubmitted(false);
                  setServicesSubmitted(false);
                  setServiceType("audit");
                }}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 hover:border-brand-blue hover:bg-dark-secondary transition-all text-left group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center group-hover:bg-brand-blue/20 transition-colors">
                    <ShoppingCart size={24} className="text-brand-blue" />
                  </div>
                  <h3 className="heading-4 mb-0">Free Ecommerce Audit</h3>
                </div>

                <p className="body-md text-secondary mb-6">
                  We'll review your storefront, checkout flow, operations, and
                  tracking — then show you what's slowing your growth.
                </p>

                <div className="flex items-center gap-2 text-brand-blue font-semibold">
                  <span>Get Started</span>
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </button>

              {/* Card 2: Other Services */}
              <button
                onClick={() => {
                  setFormError("");
                  setSuccessMessage("");
                  setAuditSubmitted(false);
                  setServicesSubmitted(false);
                  setServiceType("services");
                }}
                className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 hover:border-brand-blue hover:bg-dark-secondary transition-all text-left group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center group-hover:bg-brand-blue/20 transition-colors">
                    <Zap size={24} className="text-brand-blue" />
                  </div>
                  <h3 className="heading-4 mb-0">Other Services</h3>
                </div>

                <p className="body-md text-secondary mb-6">
                  Website design, ecommerce setup, AI chatbots, integrations —
                  tell us what you need.
                </p>

                <div className="flex items-center gap-2 text-brand-blue font-semibold">
                  <span>Explore Services</span>
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* Ecommerce Audit Path */}
      {serviceType === "audit" && (
        <>
          {/* What Happens After You Book */}
          <Section bgColor="secondary" padded={true}>
            <div className="max-w-6xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="heading-2">What Happens After You Book</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    number: "1",
                    title: "You Book",
                    description:
                      "Schedule a 30-minute call at a time that works for you.",
                  },
                  {
                    number: "2",
                    title: "We Review",
                    description:
                      "We analyze your storefront, checkout, operations, and tracking setup.",
                  },
                  {
                    number: "3",
                    title: "We Present Findings",
                    description:
                      "We show you the specific problems slowing your growth and why they matter.",
                  },
                  {
                    number: "4",
                    title: "You Get a Roadmap",
                    description:
                      "Actionable recommendations on what to fix first and why.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-lg shadow-black/10 text-center"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-white text-lg font-semibold">
                      {step.number}
                    </div>
                    <h3 className="heading-4 mb-3 text-white">{step.title}</h3>
                    <p className="body-md text-secondary">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Audit Form & Booking */}
          <Section bgColor="primary" padded={true}>
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => {
                  setFormError("");
                  setSuccessMessage("");
                  setAuditSubmitted(false);
                  setServicesSubmitted(false);
                  setServiceType(null);
                }}
                className="text-brand-blue hover:text-brand-blue/80 transition-colors mb-8 text-sm font-semibold"
              >
                ← Back to selection
              </button>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Left: Form */}
                <div>
                  <h2 className="heading-3 mb-8">Tell Us About Your Store</h2>
                  {auditSubmitted ? (
                    <div className="rounded-[2rem] border border-brand-blue/20 bg-brand-blue/5 p-8">
                      <p className="body-lg text-white font-semibold mb-4">
                        {successMessage ||
                          "Thanks! We'll reach out within 24 hours to confirm your audit."}
                      </p>
                      <p className="body-md text-secondary">
                        Your audit request is submitted. We will review your
                        details and send booking options shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleAuditSubmit} className="space-y-6">
                      {formError && (
                        <div className="p-4 bg-red-500/10 border border-red-500 text-red-200 rounded-lg">
                          {formError}
                        </div>
                      )}

                      {successMessage && (
                        <div className="p-4 bg-brand-blue bg-opacity-20 border border-brand-blue text-brand-blue rounded-lg">
                          {successMessage}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="audit-name"
                          className="block font-semibold text-primary mb-2"
                        >
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="audit-name"
                          name="name"
                          value={auditFormState.name}
                          onChange={handleAuditChange}
                          required
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="audit-email"
                          className="block font-semibold text-primary mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="audit-email"
                          name="email"
                          value={auditFormState.email}
                          onChange={handleAuditChange}
                          required
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="audit-website"
                          className="block font-semibold text-primary mb-2"
                        >
                          Website URL
                        </label>
                        <input
                          type="url"
                          id="audit-website"
                          name="website"
                          value={auditFormState.website}
                          onChange={handleAuditChange}
                          required
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                          placeholder="https://yourstore.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="audit-businessType"
                          className="block font-semibold text-primary mb-2"
                        >
                          Business Type
                        </label>
                        <select
                          id="audit-businessType"
                          name="businessType"
                          value={auditFormState.businessType}
                          onChange={handleAuditChange}
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                        >
                          <option value="ecommerce">
                            Ecommerce / Online Store
                          </option>
                          <option value="saas">SaaS / Software</option>
                          <option value="service">Service Business</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="audit-revenue"
                          className="block font-semibold text-primary mb-2"
                        >
                          Monthly Revenue Range
                        </label>
                        <select
                          id="audit-revenue"
                          name="revenue"
                          value={auditFormState.revenue}
                          onChange={handleAuditChange}
                          required
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                        >
                          <option value="">Select a range</option>
                          <option value="0-10k">$0 - $10k</option>
                          <option value="10k-50k">$10k - $50k</option>
                          <option value="50k-100k">$50k - $100k</option>
                          <option value="100k+">$100k+</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="audit-biggestIssue"
                          className="block font-semibold text-primary mb-2"
                        >
                          What's Your Biggest Issue?
                        </label>
                        <textarea
                          id="audit-biggestIssue"
                          name="biggestIssue"
                          value={auditFormState.biggestIssue}
                          onChange={handleAuditChange}
                          rows={4}
                          required
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue resize-none"
                          placeholder="Low conversions? Manual fulfillment? Unclear tracking? Tell us what's slowing you down."
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="audit-runningAds"
                          className="block font-semibold text-primary mb-2"
                        >
                          Are You Running Ads?
                        </label>
                        <select
                          id="audit-runningAds"
                          name="runningAds"
                          value={auditFormState.runningAds}
                          onChange={handleAuditChange}
                          className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                        >
                          <option value="">Select...</option>
                          <option value="yes">
                            Yes, Google Ads / Facebook
                          </option>
                          <option value="planning">Planning to start</option>
                          <option value="no">No, not currently</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary"
                      >
                        {loading ? "Sending..." : "Submit & Book Audit"}
                      </button>

                      <p className="body-sm text-muted text-center">
                        We'll review your info and send you booking options
                        within 24 hours.
                      </p>
                    </form>
                  )}
                </div>

                {/* Right: Booking Option */}
                <div>
                  <div className="rounded-[2rem] border border-white/10 bg-dark-secondary p-8 sticky top-8 h-fit">
                    <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
                      Prefer to Skip the Form?
                    </p>
                    <h3 className="heading-4 mb-6 text-white">
                      Book Your Audit Directly
                    </h3>
                    <p className="body-md text-secondary mb-6">
                      Skip the form and schedule your 30-minute audit directly.
                      Pick a time that works for you.
                    </p>
                    <Button
                      href="https://calendly.com/opun/ecommerce-audit"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Book on Calendly →
                    </Button>

                    <div className="mt-8 pt-8 border-t border-white/10">
                      <p className="text-brand-blue uppercase tracking-[0.32em] text-sm font-semibold mb-4">
                        What We Review
                      </p>
                      <ul className="space-y-3">
                        {[
                          "Storefront & product flow",
                          "Checkout experience",
                          "Fraud & order process",
                          "Shipping workflows",
                          "Tracking & analytics",
                          "Backend integrations",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <Check
                              size={18}
                              className="text-brand-blue mt-1 flex-shrink-0"
                            />
                            <span className="body-sm text-secondary">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Who This Is For / Not For */}
          <Section bgColor="secondary" padded={true}>
            <div className="max-w-6xl mx-auto">
              <h2 className="heading-2 text-center mb-12">
                Is This Audit For You?
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="card-elevated">
                  <h3 className="heading-4 mb-6 text-brand-blue">
                    ✓ This Is For You If:
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "You run an ecommerce store but conversions feel inconsistent",
                      "Checkout or product flow needs improvement",
                      "Manual order processing is eating into margins",
                      "You're running ads but tracking is unclear",
                      "Shipping and fulfillment feel disconnected",
                      "You want practical fixes, not theory",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check
                          size={20}
                          className="text-brand-blue mt-1 flex-shrink-0"
                        />
                        <span className="body-md text-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-elevated">
                  <h3 className="heading-4 mb-6 text-red-400">
                    ✗ Not For You If:
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "You just want a pretty website redesign",
                      "You're not ready to fix operational problems",
                      "You prefer quick fixes over sustainable systems",
                      "Budget is your only consideration",
                      "You're not serious about growth",
                      "You want guaranteed results (we don't guarantee)",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <X
                          size={20}
                          className="text-red-400 mt-1 flex-shrink-0"
                        />
                        <span className="body-md text-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Services Inquiry Path */}
      {serviceType === "services" && (
        <Section bgColor="primary" padded={true}>
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => {
                setFormError("");
                setSuccessMessage("");
                setAuditSubmitted(false);
                setServicesSubmitted(false);
                setServiceType(null);
              }}
              className="text-brand-blue hover:text-brand-blue/80 transition-colors mb-8 text-sm font-semibold"
            >
              ← Back to selection
            </button>

            <h2 className="heading-3 mb-8">Tell Us About Your Project</h2>

            {servicesSubmitted ? (
              <div className="rounded-[2rem] border border-brand-blue/20 bg-brand-blue/5 p-8">
                <p className="body-lg text-white font-semibold mb-4">
                  {successMessage ||
                    "Thanks for reaching out! We'll get back to you within 24 hours."}
                </p>
                <p className="body-md text-secondary">
                  Your inquiry is submitted. We will review your request and
                  reply soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleServicesSubmit} className="space-y-6">
                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500 text-red-200 rounded-lg">
                    {formError}
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 bg-brand-blue bg-opacity-20 border border-brand-blue text-brand-blue rounded-lg">
                    {successMessage}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="services-name"
                    className="block font-semibold text-primary mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="services-name"
                    name="name"
                    value={servicesFormState.name}
                    onChange={handleServicesChange}
                    required
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="services-email"
                    className="block font-semibold text-primary mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="services-email"
                    name="email"
                    value={servicesFormState.email}
                    onChange={handleServicesChange}
                    required
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="services-businessType"
                    className="block font-semibold text-primary mb-2"
                  >
                    Business Type
                  </label>
                  <input
                    type="text"
                    id="services-businessType"
                    name="businessType"
                    value={servicesFormState.businessType}
                    onChange={handleServicesChange}
                    required
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="E.g., Ecommerce, SaaS, Service Business"
                  />
                </div>

                <div>
                  <label
                    htmlFor="services-serviceNeeded"
                    className="block font-semibold text-primary mb-2"
                  >
                    What Service Do You Need?
                  </label>
                  <select
                    id="services-serviceNeeded"
                    name="serviceNeeded"
                    value={servicesFormState.serviceNeeded}
                    onChange={handleServicesChange}
                    required
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  >
                    <option value="">Select a service</option>
                    <option value="website-design">
                      Website Design & Development
                    </option>
                    <option value="ecommerce-setup" id="contact-options">
                      Ecommerce Setup
                    </option>
                    <option value="ai-chatbots">
                      AI Chatbots & Automation
                    </option>
                    <option value="google-ads">Google Ads & Tracking</option>
                    <option value="client-portal">
                      Client Portal & Dashboard
                    </option>
                    <option value="integrations">Business Integrations</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="services-projectDescription"
                    className="block font-semibold text-primary mb-2"
                  >
                    Tell Us About Your Project
                  </label>
                  <textarea
                    id="services-projectDescription"
                    name="projectDescription"
                    value={servicesFormState.projectDescription}
                    onChange={handleServicesChange}
                    rows={6}
                    required
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue resize-none"
                    placeholder="What are your goals? What challenges are you facing? What timeline do you have in mind?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary"
                >
                  {loading ? "Sending..." : "Send Inquiry"}
                </button>

                <p className="body-sm text-muted text-center">
                  We respect your privacy. We'll only use your info to respond
                  to your inquiry.
                </p>
              </form>
            )}
          </div>
        </Section>
      )}

      {/* Final CTA - Show when nothing selected */}
      {/* {!serviceType && (
        <CTASection
          headline="Ready to get started?"
          subheadline="Book your free ecommerce audit or explore our full range of services."
          buttonLabel="Choose Your Path"
          buttonHref="#contact-options"
        />
      )} */}
    </>
  );
}
