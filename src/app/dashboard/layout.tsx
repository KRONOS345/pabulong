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
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
          <div className="flex items-center justify-center rounded-md bg-primary/10 p-1">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">
              PABULONG
            </span>
            <span className="text-[10px] block font-mono uppercase tracking-widest text-primary -mt-1">
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
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
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
      <div className="space-y-4 pt-6 border-t">
        <div className="rounded-lg bg-muted/50 border p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">PostGIS + Vector</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Online
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground leading-snug">
            Supabase RLS active with Clerk isolation.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background p-4 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b bg-background/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger 
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden"
                  />
                }
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle Menu</span>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 bg-background border-r p-4"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Access workspace features</SheetDescription>
                {navContent}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight className="h-3.5 w-3.5 hidden sm:inline" />
              <span className="text-foreground font-medium capitalize">
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
                className="hidden sm:flex gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Note
              </Button>
            </Link>

            <div className="h-6 w-px bg-border" />

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
