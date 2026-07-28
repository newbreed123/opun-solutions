export type NavChild = {
  label: string;
  href: string;
};

export type NavDropdown = {
  label: string;
  children: NavChild[];
};

export type NavLink = NavChild | NavDropdown;

const realEstatePlansLabel = "Real Estate Plans";

export const navLinks: NavLink[] = [
  {
    label: "Solutions",
    children: [
      {
        label: "Solutions Overview",
        href: "/services",
      },
      {
        label: "AI Assistants & Automation",
        href: "/services/ai-chatbots-automation",
      },
    ],
  },
  {
    label: "Industries",
    children: [
      { label: "Industries Overview", href: "/industries" },
      { label: "Ecommerce", href: "/services/ecommerce-solutions" },
      { label: "Service Businesses", href: "/solutions/lead-generation-systems" },
      { label: "Real Estate Overview", href: "/industries/real-estate" },
      { label: "Real Estate Platform", href: "/real-estate/platform" },
      { label: realEstatePlansLabel, href: "/real-estate/plans" },
    ],
  },
  {
    label: "Platform",
    children: [
      {
        label: "Platform Overview",
        href: "/platform",
      },
      {
        label: "Audit Scanner",
        href: "/tools/ecommerce-audit-scanner",
      },
      {
        label: "Scheduling",
        href: "/platform#native-scheduling",
      },
      {
        label: "Analytics",
        href: "/platform#analytics-and-event-tracking",
      },
      {
        label: "Founder Dashboard",
        href: "/platform#founder-and-operational-dashboards",
      },
      {
        label: "Integrations",
        href: "/platform#backend-integrations",
      },
    ],
  },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Resources", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
