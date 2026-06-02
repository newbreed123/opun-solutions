import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OpzixAIAssistant from "@/components/OpzixAIAssistant";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Opzix Solutions - Websites, AI & Business Systems for Service Businesses",
  description:
    "We build high-converting websites, smart AI assistants, and automation systems that help service businesses grow. Website design, ecommerce, chatbots, Google Ads, client portals & integrations.",
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
        <Header />
        <main>{children}</main>
        <Footer />
        <OpzixAIAssistant />
      </body>
    </html>
  );
}
