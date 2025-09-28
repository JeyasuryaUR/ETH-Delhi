import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

import { Archivo_Black, Space_Grotesk } from "next/font/google";
import Providers from "@/lib/Providers";

// Disable prerendering globally to avoid client-side library issues
export const dynamic = 'force-dynamic';

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivoBlack.variable} ${space.variable}`}
      >
        <Providers>

          <ClientWrapper>
            {children}
          </ClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
