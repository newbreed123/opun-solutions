import React from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bgColor?: "primary" | "secondary" | "deep";
  padded?: boolean;
}

export default function Section({
  children,
  className = "",
  id,
  bgColor = "primary",
  padded = true,
}: SectionProps) {
  const bgClasses = {
    primary: "relative overflow-hidden bg-dark-bg border-t border-dark-border",
    secondary:
      "relative overflow-hidden bg-dark-secondary border-t border-dark-border",
    deep: "relative overflow-hidden bg-dark-deep border-t border-dark-border",
  };

  return (
    <section
      id={id}
      className={`${bgClasses[bgColor]} ${padded ? "section-padding" : ""} ${className}`}
    >
      <div className="container-wide">{children}</div>
    </section>
  );
}
