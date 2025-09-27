import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientWrapper from "@/components/ClientWrapper";

import { Archivo_Black, Space_Grotesk } from "next/font/google";
 
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
        
        <Toaster position="top-center" />
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
