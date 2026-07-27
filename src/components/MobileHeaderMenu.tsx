"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { navLinks } from "@/content/navigation";
import HeaderStrategyCallLink from "@/components/HeaderStrategyCallLink";
import { trackEvent } from "@/lib/analytics";

export default function MobileHeaderMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setExpandedMenu(null);
  }, [pathname]);

  function toggleMenu(menuName: string) {
    setExpandedMenu((currentMenu) => {
      const nextMenu = currentMenu === menuName ? null : menuName;

      if (nextMenu) {
        trackEvent("nav_dropdown_opened", {
          menu_name: menuName,
          device_type: "mobile",
        });
      }

      return nextMenu;
    });
  }

  function handleNavLinkClick(menuName: string, label: string, href: string) {
    trackEvent("nav_link_clicked", {
      menu_name: menuName,
      link_label: label,
      destination: href,
      device_type: "mobile",
    });
    setIsOpen(false);
    setExpandedMenu(null);
  }

  function menuId(menuName: string) {
    return `mobile-nav-${menuName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 text-primary hover:bg-white/5 hover:text-brand-cyan transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-16 bg-dark-secondary border-t border-dark-border md:top-20">
          <nav className="container-wide py-6 space-y-2">
            {navLinks.map((link) => {
              const isExpanded = expandedMenu === link.label;
              const hasChildren = "children" in link;

              return (
                <div key={link.label} className="space-y-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={menuId(link.label)}
                      onClick={() => toggleMenu(link.label)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left font-medium text-secondary transition-colors hover:text-brand-cyan aria-expanded:text-brand-cyan"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="block min-h-11 py-3 font-medium text-secondary transition-colors hover:text-brand-cyan"
                      onClick={() =>
                        handleNavLinkClick("top_level", link.label, link.href)
                      }
                    >
                      {link.label}
                    </Link>
                  )}
                  {hasChildren && isExpanded && (
                    <div id={menuId(link.label)} className="space-y-1 pl-4">
                      {link.children.map((child) => (
                        <Link
                          key={`${child.label}-${child.href}`}
                          href={child.href}
                          className="block min-h-11 py-2.5 text-sm text-secondary/80 transition-colors hover:text-brand-cyan"
                          onClick={() =>
                            handleNavLinkClick(link.label, child.label, child.href)
                          }
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-4 border-t border-dark-border">
              <HeaderStrategyCallLink
                className="block btn-primary text-center w-full"
                onNavigate={() => setIsOpen(false)}
              />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
