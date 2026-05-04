"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  {
    label: "Solutions",
    href: "/services",
    children: [
      {
        label: "Free Ecommerce Audit",
        href: "/services/ecommerce-audit",
      },
      {
        label: "Ecommerce Systems",
        href: "/services/ecommerce-solutions",
      },
      {
        label: "Lead Generation Systems",
        href: "/services",
      },
      {
        label: "AI Chatbots & Automation",
        href: "/services",
      },
      {
        label: "Client Portals & Dashboards",
        href: "/services",
      },
    ],
  },
  {
    label: "Industries",
    href: "/industries",
    children: [
      { label: "Ecommerce Brands", href: "/services/ecommerce-solutions" },
      { label: "Care Agencies", href: "/industries" },
      { label: "Coaches & Consultants", href: "/industries" },
      { label: "Local Services", href: "/industries" },
    ],
  },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-dark-bg bg-opacity-95 backdrop-blur-sm border-b border-dark-tertiary">
      <nav className="container-wide flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center group-hover:bg-brand-blue-light transition-colors">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-bold text-primary hidden sm:block">
            Opun
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <div
              key={link.href}
              className={link.children ? "relative group" : ""}
            >
              <Link
                href={link.href}
                className="text-secondary hover:text-brand-blue transition-colors font-medium"
              >
                {link.label}
              </Link>

              {link.children && (
                <div className="absolute left-0 top-full mt-3 hidden min-w-[220px] rounded-[1.75rem] border border-white/10 bg-dark-secondary p-4 shadow-xl group-hover:block">
                  {link.children.map((child) => (
                    <Link
                      key={`${child.label}-${child.href}`}
                      href={child.href}
                      className="block rounded-2xl px-4 py-3 text-secondary hover:bg-dark-bg hover:text-brand-blue transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/contact" className="btn-primary text-sm">
            Book Strategy Call
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-primary hover:text-brand-blue transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-dark-secondary border-t border-dark-tertiary">
          <nav className="container-wide py-6 space-y-2">
            {navLinks.map((link) => (
              <div key={link.href} className="space-y-1">
                <Link
                  href={link.href}
                  className="block text-secondary hover:text-brand-blue transition-colors py-3 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="space-y-1 pl-4">
                    {link.children.map((child) => (
                      <Link
                        key={`${child.label}-${child.href}`}
                        href={child.href}
                        className="block text-secondary/80 hover:text-brand-blue transition-colors py-2 text-sm"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-dark-tertiary">
              <Link
                href="/contact"
                className="block btn-primary text-center w-full"
                onClick={() => setIsOpen(false)}
              >
                Book Strategy Call
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
