import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SupportFloat } from "@/components/support-float";

export const metadata: Metadata = {
  title: "ethprofito.com",
  description: "Admin-managed trading platform starter for crypto, stocks, and gold."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SupportFloat />
        <SiteFooter />
      </body>
    </html>
  );
}
