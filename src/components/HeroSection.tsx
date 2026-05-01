import React from "react";
import Button from "./Button";

interface HeroSectionProps {
  headline: string;
  subheadline?: string;
  ctas?: Array<{
    label: string;
    href: string;
    variant?: "primary" | "secondary";
  }>;
  backgroundImage?: string;
}

export default function HeroSection({
  headline,
  subheadline,
  ctas,
  backgroundImage,
}: HeroSectionProps) {
  return (
    <section
      className={`relative w-full min-h-screen flex items-center justify-center text-center py-20 md:py-32 ${
        backgroundImage ? "bg-cover bg-center" : "bg-dark-bg"
      }`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      )}

      <div className="relative z-10 container-wide max-w-4xl mx-auto px-4">
        <h1 className="heading-1 mb-6 animate-fadeIn">{headline}</h1>

        {subheadline && (
          <p className="body-lg mb-10 text-secondary max-w-2xl mx-auto animate-fadeIn">
            {subheadline}
          </p>
        )}

        {ctas && ctas.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slideInUp">
            {ctas.map((cta, index) => (
              <Button
                key={index}
                href={cta.href}
                variant={cta.variant || "primary"}
                size="lg"
              >
                {cta.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
