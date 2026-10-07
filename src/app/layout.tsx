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
  title: "Pabulong | Butuan City Boarding Houses & Student Dormitories",
  description:
    "Hyper-local marketplace connecting students and young professionals with verified boarding houses, dormitories, and rental spaces in Butuan City, Philippines.",
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
