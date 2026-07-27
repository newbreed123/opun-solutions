"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type FocusEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import { navLinks } from "@/content/navigation";
import { trackEvent } from "@/lib/analytics";

const closeDelayMs = 180;
const hoverClickGuardMs = 350;

export default function DesktopHeaderNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerOpenedAtRef = useRef<Record<string, number>>({});
  const suppressFocusOpenRef = useRef<string | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function closeOnDesktopExit() {
      if (window.innerWidth < 1024) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("resize", closeOnDesktopExit);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("resize", closeOnDesktopExit);
      clearCloseTimer();
    };
  }, []);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openDropdown(menuName: string, source: "focus" | "pointer") {
    clearCloseTimer();
    if (source === "pointer") {
      pointerOpenedAtRef.current[menuName] = Date.now();
    }

    setOpenMenu((currentMenu) => {
      if (currentMenu !== menuName) {
        trackEvent("nav_dropdown_opened", {
          menu_name: menuName,
          device_type: "desktop",
        });
      }

      return menuName;
    });
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
      closeTimerRef.current = null;
    }, closeDelayMs);
  }

  function toggleDropdown(menuName: string) {
    clearCloseTimer();
    setOpenMenu((currentMenu) => {
      const openedByPointerAt = pointerOpenedAtRef.current[menuName] ?? 0;
      const isFreshPointerOpen =
        currentMenu === menuName &&
        Date.now() - openedByPointerAt < hoverClickGuardMs;

      if (isFreshPointerOpen) {
        pointerOpenedAtRef.current[menuName] = 0;
        return currentMenu;
      }

      const nextMenu = currentMenu === menuName ? null : menuName;

      if (nextMenu) {
        trackEvent("nav_dropdown_opened", {
          menu_name: menuName,
          device_type: "desktop",
        });
      }

      return nextMenu;
    });
  }

  function focusMenuItem(menuName: string, direction: "first" | "last") {
    window.requestAnimationFrame(() => {
      const menuLinks = menuRefs.current[menuName]?.querySelectorAll("a");
      const target =
        direction === "first"
          ? menuLinks?.[0]
          : menuLinks?.[Math.max(0, (menuLinks?.length ?? 1) - 1)];

      target?.focus();
    });
  }

  function handleTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    menuName: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleDropdown(menuName);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDropdown(menuName, "focus");
      focusMenuItem(menuName, "first");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openDropdown(menuName, "focus");
      focusMenuItem(menuName, "last");
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpenMenu(null);
      suppressFocusOpenRef.current = menuName;
      triggerRefs.current[menuName]?.focus();
    }
  }

  function handleMenuKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    menuName: string,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenMenu(null);
      suppressFocusOpenRef.current = menuName;
      triggerRefs.current[menuName]?.focus();
    }
  }

  function handleContainerFocus(menuName: string) {
    if (suppressFocusOpenRef.current === menuName) {
      suppressFocusOpenRef.current = null;
      return;
    }

    openDropdown(menuName, "focus");
  }

  function closeWhenFocusLeaves(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpenMenu(null);
    }
  }

  function trackNavLink(menuName: string, label: string, href: string) {
    trackEvent("nav_link_clicked", {
      menu_name: menuName,
      link_label: label,
      destination: href,
      device_type: "desktop",
    });
    setOpenMenu(null);
  }

  function menuId(menuName: string) {
    return `desktop-nav-${menuName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  return (
    <div ref={rootRef} className="flex items-center gap-5 xl:gap-8">
      {navLinks.map((link) => {
        if (!("children" in link)) {
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => trackNavLink("top_level", link.label, link.href)}
              className="text-secondary hover:text-brand-cyan transition-colors font-medium"
            >
              {link.label}
            </Link>
          );
        }

        const isOpen = openMenu === link.label;

        return (
          <div
            key={link.label}
            className="relative"
            onPointerEnter={() => openDropdown(link.label, "pointer")}
            onPointerLeave={scheduleClose}
            onFocus={() => handleContainerFocus(link.label)}
            onBlur={closeWhenFocusLeaves}
          >
            <button
              ref={(node) => {
                triggerRefs.current[link.label] = node;
              }}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId(link.label)}
              onClick={() => toggleDropdown(link.label)}
              onKeyDown={(event) => handleTriggerKeyDown(event, link.label)}
              className="inline-flex items-center gap-1.5 text-secondary hover:text-brand-cyan transition-colors font-medium aria-expanded:text-brand-cyan"
            >
              {link.label}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            <div
              aria-hidden="true"
              className="absolute left-0 top-full h-3 w-full"
            />

            {isOpen && (
              <div
                ref={(node) => {
                  menuRefs.current[link.label] = node;
                }}
                id={menuId(link.label)}
                role="menu"
                onPointerEnter={clearCloseTimer}
                onPointerLeave={scheduleClose}
                onKeyDown={(event) => handleMenuKeyDown(event, link.label)}
                className="absolute left-0 top-full z-[70] mt-3 min-w-[270px] rounded-xl border border-dark-border bg-dark-card p-3 shadow-xl backdrop-blur-xl"
              >
                {link.children.map((child, index) => {
                  const showDivider =
                    link.label === "Industries" && index === 4;

                  return (
                    <Link
                      key={`${child.label}-${child.href}`}
                      href={child.href}
                      role="menuitem"
                      onClick={() =>
                        trackNavLink(link.label, child.label, child.href)
                      }
                      className={`block rounded-lg px-4 py-3 text-secondary hover:bg-white/5 hover:text-brand-cyan focus-visible:bg-white/5 focus-visible:text-brand-cyan focus-visible:outline-none transition-colors ${
                        showDivider ? "mt-2 border-t border-dark-border pt-4" : ""
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
