"use client";

import * as React from "react";
import {
  Users,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminMetrics } from "@/actions/admin";

interface AdminMetricsCardsProps {
  metrics: AdminMetrics;
}

export function AdminMetricsCards({ metrics }: AdminMetricsCardsProps) {
  const statItems = [
    {
      label: "Total Users",
      value: metrics.totalUsers,
      subtext: "Seekers & landlords",
      icon: Users,
      color: "text-blue-400 bg-blue-950/30 border-blue-500/20",
    },
    {
      label: "Total Listings",
      value: metrics.totalListings,
      subtext: "All boarding houses",
      icon: Building2,
      color: "text-emerald-400 bg-emerald-950/30 border-emerald-500/20",
    },
    {
      label: "Pending Reviews",
      value: metrics.pendingReviews,
      subtext: "Awaiting approval",
      icon: Clock,
      color: metrics.pendingReviews > 0
        ? "text-amber-400 bg-amber-950/30 border-amber-500/30"
        : "text-muted-foreground bg-muted/40 border-border/40",
    },
    {
      label: "Active Reports",
      value: metrics.activeReports,
      subtext: "Pending / Investigating",
      icon: AlertTriangle,
      color: metrics.activeReports > 0
        ? "text-rose-400 bg-rose-950/30 border-rose-500/30"
        : "text-muted-foreground bg-muted/40 border-border/40",
    },
    {
      label: "Published",
      value: metrics.publishedListings,
      subtext: "Live on marketplace",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-950/30 border-emerald-500/20",
    },
    {
      label: "Suspended",
      value: metrics.suspendedListings,
      subtext: "Moderated / offline",
      icon: Ban,
      color: metrics.suspendedListings > 0
        ? "text-red-400 bg-red-950/30 border-red-500/30"
        : "text-muted-foreground bg-muted/40 border-border/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-border transition-colors"
          >
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-md border ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {item.value}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {item.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
