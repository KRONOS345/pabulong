"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Building2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { resolveReportAction } from "@/actions/admin";
import type { Report, ReportStatus } from "@/lib/marketplace-types";

interface ExtendedReport extends Report {
  boarding_house?: {
    id: string;
    name: string;
    address: string;
    barangay: string;
  } | null;
}

interface ReportsTableProps {
  initialReports: ExtendedReport[];
}

export function ReportsTable({ initialReports }: ReportsTableProps) {
  const [reports, setReports] = React.useState<ExtendedReport[]>(initialReports);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isPending, startTransition] = React.useTransition();

  const filteredReports = React.useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter === "all") return true;
      return r.status === statusFilter;
    });
  }, [reports, statusFilter]);

  const handleStatusChange = (
    report: ExtendedReport,
    newStatus: ReportStatus
  ) => {
    startTransition(async () => {
      const res = await resolveReportAction(report.id, newStatus);
      if (res.success) {
        toast.success(`Report marked as '${newStatus}'.`);
        setReports((prev) =>
          prev.map((item) =>
            item.id === report.id ? { ...item, status: newStatus as ReportStatus } : item
          )
        );
      } else {
        toast.error(res.error || "Failed to update report status.");
      }
    });
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 bg-amber-950/20 font-medium"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "investigating":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/40 text-blue-400 bg-blue-950/20 font-medium"
          >
            <Eye className="h-3 w-3 mr-1" />
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 font-medium"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case "dismissed":
        return (
          <Badge
            variant="outline"
            className="border-border text-muted-foreground font-medium"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Dismissed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusTabs = [
    { id: "all", label: "All Reports" },
    { id: "pending", label: "Pending" },
    { id: "investigating", label: "Investigating" },
    { id: "resolved", label: "Resolved" },
    { id: "dismissed", label: "Dismissed" },
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {statusTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={statusFilter === tab.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(tab.id)}
            className={`text-xs h-8 whitespace-nowrap ${
              statusFilter === tab.id
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[320px]">Reason & Details</TableHead>
              <TableHead>Target Boarding House</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Moderation Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No reports found</p>
                    <p className="text-xs text-muted-foreground">
                      The moderation queue is currently clear for this filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="border-border/40 hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        {report.reason}
                      </span>
                      {report.details && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {report.details}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.boarding_house ? (
                      <Link
                        href={`/listings/${report.boarding_house.id}`}
                        target="_blank"
                        className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 group"
                      >
                        <Building2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {report.boarding_house.name}
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {report.boarding_house_id ? "Listing ID linked" : "General report"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {report.created_at
                      ? new Date(report.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {report.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(report, "investigating")}
                            className="h-8 text-xs text-blue-400 border-blue-500/30 hover:bg-blue-950/20"
                          >
                            Investigate
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(report, "resolved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(report, "dismissed")}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Dismiss
                          </Button>
                        </>
                      )}

                      {report.status === "investigating" && (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(report, "resolved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(report, "dismissed")}
                            className="h-8 text-xs text-muted-foreground"
                          >
                            Dismiss
                          </Button>
                        </>
                      )}

                      {(report.status === "resolved" || report.status === "dismissed") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(report, "pending")}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Re-open
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
