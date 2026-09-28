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
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Indexed Brain Notes",
      value: "142",
      change: "pgvector synced",
      icon: Brain,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "Boarding Houses",
      value: "24",
      change: "PostGIS mapped",
      icon: Building2,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      title: "Available Rooms",
      value: "47",
      change: "92% occupancy rate",
      icon: MapPin,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  const quickActions = [
    {
      title: "Second Brain Intelligence",
      description: "Query knowledge base with vector similarity or add new synthesized research notes.",
      href: "/dashboard/notes",
      buttonText: "Access Second Brain",
      icon: Brain,
      gradient: "from-indigo-500/20 via-indigo-600/5 to-transparent",
      accent: "border-indigo-500/30",
    },
    {
      title: "Placement Control Kanban",
      description: "Track student housing inquiries through Viewing, Deposit Pending, and Placed stages.",
      href: "/dashboard/placements",
      buttonText: "Open Kanban Board",
      icon: Kanban,
      gradient: "from-purple-500/20 via-purple-600/5 to-transparent",
      accent: "border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            AI-Augmented Operational Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Unified Workspace & Housing Placement
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Welcome to Pabulong. Seamlessly manage knowledge retention with vector embeddings and accelerate boarding house student placements in real-time.
          </p>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
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
              className={`relative overflow-hidden border ${module.accent} bg-slate-900/40 backdrop-blur-md transition-all hover:border-slate-700`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${module.gradient} pointer-events-none`}
              />
              <CardHeader className="relative z-10 pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-xs text-slate-400">
                    Core Engine
                  </Badge>
                </div>
                <CardTitle className="text-xl text-white pt-3">{module.title}</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-2">
                <Link href={module.href}>
                  <Button variant="gradient" className="w-full gap-2">
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
      <Card className="border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white">Live Placement Pipeline</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Current active pipeline distribution across stages
              </CardDescription>
            </div>
            <Link href="/dashboard/placements">
              <Button variant="outline" size="sm" className="border-slate-800 text-xs">
                View Full Kanban
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Inquiry</div>
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-[11px] text-indigo-400">Prospective tenants</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Viewing</div>
              <div className="text-2xl font-bold text-amber-400">5</div>
              <div className="text-[11px] text-amber-300">Scheduled walkthroughs</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Deposit Pending</div>
              <div className="text-2xl font-bold text-blue-400">3</div>
              <div className="text-[11px] text-blue-300">Reservation processing</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Placed</div>
              <div className="text-2xl font-bold text-emerald-400">2</div>
              <div className="text-[11px] text-emerald-300">Completed move-in</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
