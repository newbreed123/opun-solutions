import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OpzixAIAssistant from "@/components/OpzixAIAssistant";
import StrategyCallBookingTracker from "@/components/StrategyCallBookingTracker";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-YKPQJ3XSRE";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GOOGLE_TAG_ID = GOOGLE_ADS_ID || GA_MEASUREMENT_ID;

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
      "Opzix builds connected websites, AI assistants, analytics, automation, scheduling, dashboards, and integrations for modern businesses.",
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
            ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
          `}
        </Script>
        <Header />
        <main>{children}</main>
        <Footer />
        <OpzixAIAssistant />
        <StrategyCallBookingTracker />
      </body>
    </html>
  );
}
