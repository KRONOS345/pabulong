import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricsOverview } from "@/components/owner/metrics-overview";
import { OwnerPropertyCard } from "@/components/owner/owner-property-card";
import {
  getOwnerMetricsAction,
  getOwnerPropertiesAction,
  getOwnerInquiriesAction,
} from "@/actions/marketplace";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const [metrics, properties, inquiries] = await Promise.all([
    getOwnerMetricsAction(),
    getOwnerPropertiesAction(),
    getOwnerInquiriesAction(),
  ]);

  const recentProperties = properties.slice(0, 3);
  const recentInquiries = inquiries.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Landlord Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your boarding houses, room vacancies, and student leads across Butuan City.
          </p>
        </div>

        <Link href="/owner/properties/new">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            Add Boarding House
          </Button>
        </Link>
      </div>

      {/* KPI Stat Cards */}
      <MetricsOverview metrics={metrics} />

      {/* Properties Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              My Boarding Houses
            </h2>
            <p className="text-xs text-muted-foreground">
              {properties.length} {properties.length === 1 ? "property" : "properties"} under your management
            </p>
          </div>

          {properties.length > 3 && (
            <Link href="/owner/properties">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                View all ({properties.length})
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {properties.length === 0 ? (
          <Card className="border-dashed border-2 border-border/60 bg-card/40 text-center py-12 px-4">
            <CardContent className="space-y-3 max-w-md mx-auto">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                No boarding houses listed yet
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register your boarding house or dormitory in Butuan City to start receiving inquiries from students and young professionals.
              </p>
              <div className="pt-2">
                <Link href="/owner/properties/new">
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                    <Plus className="h-4 w-4" />
                    Register First Property
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentProperties.map((property) => (
              <OwnerPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Inquiries Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Recent Seeker Inquiries
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct inquiries submitted from your public listing pages
            </p>
          </div>

          {inquiries.length > 0 && (
            <Link href="/owner/inquiries">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                Open Inquiry Inbox ({inquiries.length})
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {inquiries.length === 0 ? (
          <Card className="border-border/60 bg-card/40 text-center py-8 px-4">
            <CardContent className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs text-muted-foreground">
                No inquiries received yet. Once seekers discover your published properties, their inquiries and viewing requests will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 bg-card/60 divide-y divide-border/40">
            {recentInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {inquiry.seeker?.full_name || "Seeker"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 capitalize bg-muted font-normal text-muted-foreground"
                    >
                      {inquiry.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Property:{" "}
                    <span className="text-foreground font-medium">
                      {inquiry.boarding_house?.name || "Boarding House"}
                    </span>
                    {inquiry.room?.room_number && (
                      <span> • Room {inquiry.room.room_number}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground/90 italic line-clamp-1">
                    &ldquo;{inquiry.message}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link href="/owner/inquiries">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      View Lead
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
