import type { MetadataRoute } from "next";

const baseUrl = "https://opzix.io";

const publicRoutes = [
  "/",
  "/services",
  "/services/ecommerce-solutions",
  "/services/ecommerce-audit",
  "/services/ai-chatbots-automation",
  "/solutions/lead-generation-systems",
  "/industries",
  "/industries/real-estate",
  "/platform",
  "/case-studies",
  "/case-studies/sales-coach",
  "/case-studies/care-agency",
  "/case-studies/care-agency-growth",
  "/case-studies/ecommerce-ops",
  "/case-studies/ecommerce-system-success",
  "/insights",
  "/insights/why-ai-chatbots-fail",
  "/insights/what-breaks-after-checkout",
  "/insights/ecommerce-traffic-vs-systems",
  "/tools/ecommerce-audit-scanner",
  "/about",
  "/contact",
  "/book/strategy-session",
  "/strategy-call",
  "/strategy-call-confirmed",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.includes("real-estate") || route === "/platform" ? 0.85 : 0.7,
  }));
}
