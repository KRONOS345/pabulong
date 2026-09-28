import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pabulong | AI Second Brain & Boarding House Placement Platform",
  description:
    "Unified intelligence engine for semantic knowledge retention, student boarding house locator, and end-to-end placement orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <PwaRegister />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
