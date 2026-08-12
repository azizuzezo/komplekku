import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/lib/query/provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Komplekku",
    template: "%s · Komplekku",
  },
  description: "Pusat informasi dan layanan lingkungan tempat tinggal.",
  applicationName: "Komplekku",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/brand/komplekku-mark.png",
        sizes: "1254x1254",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/brand/komplekku-mark.png",
        sizes: "1254x1254",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Komplekku",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#28594A",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
