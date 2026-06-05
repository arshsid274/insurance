import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/lib/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedLocator — Find an in-network medical provider near you",
  description:
    "Search and navigate to medical providers in your insurance network. Hospitals, clinics, pharmacies, diagnostics, and more across the UAE.",
  applicationName: "MedLocator",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedLocator",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0891B2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
