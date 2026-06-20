import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/browser-health": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/ecommerce-audit-scanner": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/scanner-health": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  outputFileTracingExcludes: {
    "*": [
      "./artifacts/**/*",
      "./tmp-zora-ux-screenshots/**/*",
      "./public/audit-screenshots/**/*",
      "./debug.log",
      "./scan-output.json",
      "./scan_output.json",
    ],
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
  compress: true,
};

export default nextConfig;
