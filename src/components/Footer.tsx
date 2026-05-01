import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-secondary border-t border-dark-tertiary">
      <div className="container-wide py-16 md:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">O</span>
              </div>
              <span className="text-xl font-bold text-primary">Opun</span>
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
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  Web Design
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  AI Chatbots
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  Ecommerce
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
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
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/case-studies"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
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
                <Mail size={16} className="text-brand-blue flex-shrink-0" />
                <a
                  href="mailto:hello@opun.com"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  hello@opun.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-brand-blue flex-shrink-0" />
                <a
                  href="tel:+1234567890"
                  className="body-sm text-secondary hover:text-brand-blue transition-colors"
                >
                  +1 (234) 567-890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dark-tertiary my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="body-sm text-muted">
            © {currentYear} Opun Solutions. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-blue transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-blue transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-blue transition-colors"
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
