import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { ToasterWrapper } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#FCC800",
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
    apple: "/icon-192.png",
    icon: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preconnect("https://api.dicebear.com");
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, manrope.variable)}
    >
      <head></head>
      <body className="min-h-full relative flex flex-col">
        {children}
        <ToasterWrapper />
        <PwaRegister />
      </body>
    </html>
  );
}
