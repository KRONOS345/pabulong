import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportsTable } from "@/components/admin/reports-table";
import { getAdminReportsAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await getAdminReportsAction();

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
              <AlertTriangle className="h-6 w-6 text-rose-400" />
              Disputes & User Reports
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Review user-submitted safety reports, misleading listings, and community guideline violations.
          </p>
        </div>
      </div>

      <ReportsTable initialReports={reports} />
    </div>
  );
}
