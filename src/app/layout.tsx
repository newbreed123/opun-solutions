import type { Metadata, Viewport } from "next";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://opzix.io"),
  title: "Opzix | AI-Powered Business Systems",
  description:
    "Opzix builds AI-powered business systems for leads, sales, customer experience, and operations across ecommerce, service businesses, and real estate.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Opzix | AI-Powered Business Systems",
  description:
      "Opzix builds AI-powered business platforms that connect customer experience, automation, analytics, scheduling, dashboards, and integrations for modern businesses.",
    url: "/",
    siteName: "Opzix",
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>O</text></svg>",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AnalyticsScripts />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
