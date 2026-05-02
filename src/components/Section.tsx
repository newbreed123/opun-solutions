import React from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bgColor?: "primary" | "secondary";
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
    primary: "bg-dark-bg",
    secondary: "bg-dark-secondary",
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
