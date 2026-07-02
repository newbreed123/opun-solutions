"use client";

import Link from "next/link";
import React from "react";
import { trackEvent } from "@/lib/analytics";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import {
  openStrategyCall,
  type StrategyCallSource,
} from "@/lib/booking/openStrategyCall";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  target?: "_blank" | "_self";
  rel?: string;
  trackingSource?: StrategyCallSource;
}

export default function Button({
  href,
  onClick,
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled = false,
  target = "_self",
  rel = "",
  trackingSource,
}: ButtonProps) {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm w-full max-w-[calc(100vw-2rem)] mx-auto sm:w-auto sm:max-w-none sm:mx-0",
    md: "px-6 py-3 text-base w-full max-w-[calc(100vw-2rem)] mx-auto sm:w-auto sm:max-w-none sm:mx-0",
    lg: "sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[calc(100vw-2rem)] mx-auto sm:w-auto sm:max-w-none sm:mx-0",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  const label = typeof children === "string" ? children.trim() : "";
  const handleClick = (
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (href === STRATEGY_CALL_URL) {
      event.preventDefault();
      openStrategyCall({
        source: trackingSource || "hero",
      });
    }

    if (label === "Talk With Opzix") {
      trackEvent("audit_cta_clicked", { sourceArea: "hero" });
    }

    onClick?.();
  };

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={classes}
        onClick={handleClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
