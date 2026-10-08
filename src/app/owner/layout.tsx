import * as React from "react";
import { Metadata } from "next";
import { OwnerNav } from "@/components/owner/owner-nav";

export const metadata: Metadata = {
  title: "Landlord Portal | Pabulong",
  description:
    "Manage your boarding houses, rooms, rates, vacancies, and seeker inquiries in Butuan City.",
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <OwnerNav />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
