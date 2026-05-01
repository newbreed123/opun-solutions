"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import Section from "@/components/Section";
import CTASection from "@/components/CTASection";
import Button from "@/components/Button";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    service: "general",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setSubmitted(true);
      setFormState({
        name: "",
        email: "",
        phone: "",
        service: "general",
        message: "",
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <HeroSection
        headline="Get In Touch"
        subheadline="Ready to grow your business? Let's talk about your goals and how we can help."
      />

      {/* Contact Form & Info */}
      <Section bgColor="primary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="heading-3 mb-8">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-brand-blue flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-primary mb-1">Email</p>
                  <a
                    href="mailto:hello@opun.com"
                    className="body-md text-secondary hover:text-brand-blue transition-colors"
                  >
                    hello@opun.com
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="w-6 h-6 text-brand-blue flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-primary mb-1">Phone</p>
                  <a
                    href="tel:+1234567890"
                    className="body-md text-secondary hover:text-brand-blue transition-colors"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-brand-blue flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-primary mb-1">
                    Response Time
                  </p>
                  <p className="body-md text-secondary">
                    Within 24 business hours
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-dark-secondary rounded-lg border border-dark-tertiary">
              <p className="body-sm text-secondary">
                <strong>Pro tip:</strong> For faster response, include as many
                details as possible about your project and goals in the form
                below.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && (
                <div className="p-4 bg-green-900 bg-opacity-20 border border-green-500 text-green-200 rounded-lg">
                  Thanks for reaching out! We'll get back to you within 24
                  hours.
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block font-semibold text-primary mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  placeholder="Your name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-semibold text-primary mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block font-semibold text-primary mb-2"
                  >
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="+1 (234) 567-890"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="service"
                  className="block font-semibold text-primary mb-2"
                >
                  Service of Interest
                </label>
                <select
                  id="service"
                  name="service"
                  value={formState.service}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="general">General Inquiry</option>
                  <option value="website">Website Design & Development</option>
                  <option value="ecommerce">Ecommerce Setup</option>
                  <option value="chatbot">AI Chatbots</option>
                  <option value="ads">Google Ads & Tracking</option>
                  <option value="portal">Client Portals</option>
                  <option value="integration">Business Integrations</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block font-semibold text-primary mb-2"
                >
                  Tell Us About Your Project
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-dark-secondary border border-dark-tertiary rounded-lg text-primary focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue resize-none"
                  placeholder="What's your business like? What are your main challenges? What do you hope to achieve?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

              <p className="body-sm text-muted text-center">
                We respect your privacy. We'll only use your info to respond to
                your inquiry.
              </p>
            </form>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section bgColor="secondary">
        <div className="max-w-3xl">
          <h2 className="heading-2 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="heading-4 mb-3">
                What's the typical project timeline?
              </h3>
              <p className="body-lg text-secondary">
                Most projects take 4-12 weeks depending on scope. A website
                redesign is usually 6-8 weeks. We'll give you an accurate
                timeline during our initial strategy call.
              </p>
            </div>

            <div>
              <h3 className="heading-4 mb-3">How much do services cost?</h3>
              <p className="body-lg text-secondary">
                Pricing varies based on your project complexity and scope.
                Website projects range from $8k-$25k. We offer custom quotes
                after understanding your needs. There are no hidden fees.
              </p>
            </div>

            <div>
              <h3 className="heading-4 mb-3">Do you offer ongoing support?</h3>
              <p className="body-lg text-secondary">
                Yes! We offer maintenance, updates, and optimization packages.
                Most clients work with us on an ongoing basis to continuously
                improve their systems and campaigns.
              </p>
            </div>

            <div>
              <h3 className="heading-4 mb-3">
                Can you work with our existing website/system?
              </h3>
              <p className="body-lg text-secondary">
                Absolutely. We can audit your current setup, optimize what's
                working, and improve or rebuild what's not. We're not dogmatic
                about tech—we choose what's best for your business.
              </p>
            </div>

            <div>
              <h3 className="heading-4 mb-3">
                How do I know if we're a good fit?
              </h3>
              <p className="body-lg text-secondary">
                We're a great fit if you: (1) Are serious about growth, (2) Have
                budget to invest, (3) Want a partner who focuses on results, not
                vanity metrics. We're probably not a fit if you're just "testing
                the waters" or only care about the cheapest option.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <CTASection
        headline="Still have questions?"
        subheadline="Book a free 30-minute strategy call. No sales pitch, just honest advice on how we can help your business grow."
        buttonLabel="Schedule a Call"
        buttonHref="/contact"
      />
    </>
  );
}
