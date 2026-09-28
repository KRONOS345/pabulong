"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Kanban,
  Building,
  Layers,
  Menu,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { HeaderUserButton } from "@/components/auth/user-button-client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: Layers,
    badge: null,
  },
  {
    name: "Second Brain",
    href: "/dashboard/notes",
    icon: Brain,
    badge: "Vector AI",
  },
  {
    name: "Placement Kanban",
    href: "/dashboard/placements",
    icon: Kanban,
    badge: "Live",
  },
  {
    name: "Properties & Rooms",
    href: "/dashboard/properties",
    icon: Building,
    badge: "Inventory",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 px-3 py-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PABULONG
            </span>
            <span className="text-[10px] block font-mono uppercase tracking-widest text-indigo-400 -mt-1">
              Workspace
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-indigo-400"
                        : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="space-y-4 pt-6 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">PostGIS + Vector</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Online
            </span>
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            Supabase RLS active with Clerk Sub Token isolation.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl p-4 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden border-slate-800"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 bg-slate-950 border-r border-slate-800 p-4"
              >
                {navContent}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 hidden sm:inline" />
              <span className="text-white font-medium capitalize">
                {pathname.split("/").pop() || "Dashboard"}
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/notes">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2 border-slate-800 hover:bg-slate-800/60"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Quick Note
              </Button>
            </Link>

            <div className="h-8 w-px bg-slate-800" />

            {/* Clerk User Button with Fallback */}
            <div className="flex items-center gap-2">
              <HeaderUserButton />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
