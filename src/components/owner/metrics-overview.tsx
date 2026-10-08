import * as React from "react";
import { Building2, Bed, Users, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OwnerMetrics } from "@/lib/marketplace-types";

interface MetricsOverviewProps {
  metrics: OwnerMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      title: "Boarding Houses",
      value: metrics.totalProperties,
      label: "Registered properties",
      icon: Building2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Total Rooms",
      value: metrics.totalRooms,
      label: `${metrics.totalCapacity} total capacity`,
      icon: Bed,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Available Beds",
      value: metrics.availableBeds,
      label: `${metrics.occupancyRate}% estimated occupancy`,
      icon: Users,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      badge:
        metrics.availableBeds === 0 && metrics.totalCapacity > 0
          ? "Full Occupancy"
          : `${metrics.availableBeds} Vacant`,
    },
    {
      title: "Pending Inquiries",
      value: metrics.pendingInquiriesCount,
      label: `${metrics.totalInquiriesCount} total leads received`,
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      badge: metrics.pendingInquiriesCount > 0 ? "Needs Review" : "Up to date",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-border transition-colors"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`h-8 w-8 rounded-lg ${card.bgColor} ${card.borderColor} border flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {card.value}
                </div>
                {card.badge && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 font-medium ${
                      card.value > 0 && card.title === "Pending Inquiries"
                        ? "bg-purple-950/40 text-purple-400 border-purple-500/40"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {card.badge}
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-xs text-muted-foreground truncate">
                {card.label}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
