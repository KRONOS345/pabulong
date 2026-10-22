import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { AccessDenied } from "@/components/admin/access-denied";
import { verifyAdminSession } from "@/actions/admin";

export const metadata: Metadata = {
  title: "Admin Console | Pabulong",
  description:
    "Pabulong Butuan City housing marketplace administration, listing moderation, and user management console.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession();

  // If unauthenticated, redirect to login
  if (!session.userId) {
    redirect("/sign-in");
  }

  // If authenticated but not in the trusted 'admin' role, show Access Denied
  if (!session.isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <AccessDenied
          currentRole={session.role || "seeker"}
          errorMessage={session.error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AdminNav />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
