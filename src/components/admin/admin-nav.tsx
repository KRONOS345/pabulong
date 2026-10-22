"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  AlertTriangle,
  ArrowLeft,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserButton } from "@clerk/nextjs";

export function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/listings", label: "Listings", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4 max-w-7xl">
        {/* Brand & Context */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  Pabulong
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-indigo-500/40 text-indigo-400 bg-indigo-950/30 font-semibold"
                >
                  Admin
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline leading-none">
                Platform Moderation & Ops
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Admin Navigation">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 h-9 text-sm font-medium ${
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA / Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/owner" className="hidden lg:inline-flex">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9">
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              Landlord Portal
            </Button>
          </Link>

          <Link href="/" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9">
              <ArrowLeft className="h-3.5 w-3.5" />
              Seeker Portal
            </Button>
          </Link>

          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8 ring-1 ring-border",
              },
            }}
          />

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                  aria-label="Open Admin Menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card p-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  Admin Console
                </SheetTitle>
              </SheetHeader>

              <div className="py-4 space-y-2">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-2.5 h-10 ${
                          isActive
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}

                <div className="pt-3 border-t space-y-2">
                  <Link
                    href="/owner"
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Building2 className="h-4 w-4 text-emerald-500" />
                      Landlord Portal
                    </Button>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Seeker Portal
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
