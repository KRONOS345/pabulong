import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminMetricsCards } from "@/components/admin/admin-metrics-cards";
import { ListingsModerationTable } from "@/components/admin/listings-moderation-table";
import {
  getAdminMetricsAction,
  getAdminListingsAction,
  getAdminReportsAction,
  getAdminUsersAction,
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [metrics, listings, reports, users] = await Promise.all([
    getAdminMetricsAction(),
    getAdminListingsAction(),
    getAdminReportsAction(),
    getAdminUsersAction(),
  ]);

  const pendingListings = listings.filter((l) => l.status === "pending_review");
  const activeReports = reports.filter(
    (r) => r.status === "pending" || r.status === "investigating"
  );
  const recentListings = listings.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Platform Command Center
            </h1>
            <Badge
              variant="outline"
              className="border-indigo-500/40 text-indigo-400 bg-indigo-950/20 font-semibold text-xs"
            >
              Live Operations
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Governance, listing moderation, user management, and dispute resolution for Butuan City.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/listings">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
              <Building2 className="h-3.5 w-3.5" />
              All Listings ({listings.length})
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
              <Users className="h-3.5 w-3.5" />
              Directory ({users.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <AdminMetricsCards metrics={metrics} />

      {/* Urgent Action Queues */}
      {(pendingListings.length > 0 || activeReports.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Listings Queue */}
          {pendingListings.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-950/10">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <Clock className="h-4 w-4" />
                    Pending Approvals ({pendingListings.length})
                  </div>
                  <Link href="/admin/listings?status=pending_review">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-amber-300 hover:text-amber-200">
                      View Queue
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  There are {pendingListings.length} boarding houses waiting for administrator review before being visible to students in Butuan.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Active Reports Queue */}
          {activeReports.length > 0 && (
            <Card className="border-rose-500/30 bg-rose-950/10">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Active User Reports ({activeReports.length})
                  </div>
                  <Link href="/admin/reports">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-rose-300 hover:text-rose-200">
                      View Reports
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeReports.length} flagged boarding houses or safety concerns require investigation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Primary Section: Listings Moderation Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              Listing Moderation Directory
            </h2>
            <p className="text-xs text-muted-foreground">
              Review, approve, reject with reason, or suspend boarding houses across Butuan City.
            </p>
          </div>
          <Link href="/admin/listings">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
              Full Directory
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <ListingsModerationTable initialListings={recentListings} />
      </div>
    </div>
  );
}
