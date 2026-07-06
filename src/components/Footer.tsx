import Link from "next/link";
import { Mail, Linkedin, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-deep border-t border-dark-border">
      <div className="container-wide py-16 md:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-cyan shadow-glow flex items-center justify-center">
                <span className="text-white font-bold">O</span>
              </div>
              <span className="text-xl font-bold text-primary">Opzix</span>
            </div>
            <p className="body-sm text-secondary">
              Helping service businesses and ecommerce brands grow through
              websites, AI tools, automation, and backend systems.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-primary mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/services/ai-chatbots-automation"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  Web Design
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  AI Business Assistants
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  Ecommerce
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-primary mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/case-studies"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-primary mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-brand-cyan flex-shrink-0" />
                <a
                  href="mailto:hello@opzix.io"
                  className="body-sm text-secondary hover:text-brand-cyan transition-colors"
                >
                  hello@opzix.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dark-border my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="body-sm text-muted">
            © {currentYear} Opzix Solutions. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-cyan transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-cyan transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-cyan transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
