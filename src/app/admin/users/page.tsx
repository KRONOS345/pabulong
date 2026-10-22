import * as React from "react";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/admin/users-table";
import { getAdminUsersAction, verifyAdminSession } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([
    getAdminUsersAction(),
    verifyAdminSession(),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-400" />
              User Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            View student seekers and landlords, manage verification badges, and coordinate account roles.
          </p>
        </div>
      </div>

      <UsersTable initialUsers={users} currentAdminId={session.userId || undefined} />
    </div>
  );
}
