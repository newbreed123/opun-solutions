import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/opzix-admin/"],
    },
    sitemap: "https://opzix.io/sitemap.xml",
  };
}
