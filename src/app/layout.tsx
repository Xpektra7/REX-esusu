import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SerwistProvider } from "@serwist/next/react";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans-alt",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFCC00",
};

export const metadata: Metadata = {
  title: "Esusu — Digital Group Savings",
  description:
    "Digital Ajo/Esusu platform powered by Nomba. Save together, transparently.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Esusu",
  },
  icons: {
    apple: "/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        manrope.variable,
        ibmPlexSans.variable,
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/sw.js">{children}</SerwistProvider>
        <Toaster />
      </body>
    </html>
  );
}
