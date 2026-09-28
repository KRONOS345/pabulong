import Link from "next/link";
import {
  Brain,
  Kanban,
  Building2,
  Users,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverviewPage() {
  const stats = [
    {
      title: "Active Placements",
      value: "18",
      change: "+28% this month",
      icon: Users,
    },
    {
      title: "Indexed Brain Notes",
      value: "142",
      change: "pgvector synced",
      icon: Brain,
    },
    {
      title: "Boarding Houses",
      value: "24",
      change: "PostGIS mapped",
      icon: Building2,
    },
    {
      title: "Available Rooms",
      value: "47",
      change: "92% occupancy rate",
      icon: MapPin,
    },
  ];

  const quickActions = [
    {
      title: "Second Brain Intelligence",
      description: "Query knowledge base with vector similarity or add new synthesized research notes.",
      href: "/dashboard/notes",
      buttonText: "Access Second Brain",
      icon: Brain,
    },
    {
      title: "Placement Control Kanban",
      description: "Track student housing inquiries through Viewing, Deposit Pending, and Placed stages.",
      href: "/dashboard/placements",
      buttonText: "Open Kanban Board",
      icon: Kanban,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Augmented Operational Command
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Unified Workspace & Housing Placement
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome to Pabulong. Seamlessly manage knowledge retention with vector embeddings and accelerate boarding house student placements in real-time.
          </p>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-primary/10 border border-primary/20`}>
                  <Icon className={`h-6 w-6 text-primary`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Core Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quickActions.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.title}
              className="relative overflow-hidden transition-all hover:border-primary/50"
            >
              <CardHeader className="relative z-10 pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Core Engine
                  </Badge>
                </div>
                <CardTitle className="text-xl pt-3">{module.title}</CardTitle>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-2">
                <Link href={module.href}>
                  <Button className="w-full gap-2">
                    {module.buttonText}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline Status Snapshot */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Live Placement Pipeline</CardTitle>
              <CardDescription className="text-xs">
                Current active pipeline distribution across stages
              </CardDescription>
            </div>
            <Link href="/dashboard/placements">
              <Button variant="outline" size="sm" className="text-xs">
                View Full Kanban
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Inquiry</div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-[11px] text-muted-foreground">Prospective tenants</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Viewing</div>
              <div className="text-2xl font-bold">5</div>
              <div className="text-[11px] text-muted-foreground">Scheduled walkthroughs</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Deposit Pending</div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-[11px] text-muted-foreground">Reservation processing</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Placed</div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-[11px] text-muted-foreground">Completed move-in</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
