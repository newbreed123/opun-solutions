import Link from "next/link";
import React from "react";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  target?: "_blank" | "_self";
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
}: ButtonProps) {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm w-full max-w-[360px] mx-auto sm:w-auto sm:max-w-none sm:mx-0",
    md: "px-6 py-3 text-base w-full max-w-[360px] mx-auto sm:w-auto sm:max-w-none sm:mx-0",
    lg: "sm:px-8 sm:py-4 px-6 py-3 text-base sm:text-lg w-full max-w-[360px] mx-auto sm:w-auto sm:max-w-none sm:mx-0",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} target={target} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
