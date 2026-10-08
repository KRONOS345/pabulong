"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  MessageSquare,
  Plus,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserButton } from "@clerk/nextjs";

export function OwnerNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const ownerLinks = [
    { href: "/owner", label: "Overview", icon: LayoutDashboard },
    { href: "/owner/properties", label: "My Properties", icon: Building2 },
    { href: "/owner/inquiries", label: "Inquiries", icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Context */}
        <div className="flex items-center gap-6">
          <Link href="/owner" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-emerald-600/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  Pabulong
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-400 bg-emerald-950/30 font-medium"
                >
                  Landlord
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline leading-none">
                Property & Room Manager
              </span>
            </div>
          </Link>

          {/* Desktop Owner Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Landlord Navigation">
            {ownerLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/owner"
                  ? pathname === "/owner"
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

        {/* Right CTA / Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/owner/properties/new" className="hidden sm:inline-flex">
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-9 text-xs sm:text-sm shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Boarding House
            </Button>
          </Link>

          <Link href="/" className="hidden lg:inline-flex">
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
                  aria-label="Open Landlord Menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card p-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-emerald-600/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                    P
                  </div>
                  Landlord Portal
                </SheetTitle>
              </SheetHeader>

              <div className="py-4 space-y-2">
                {ownerLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === "/owner"
                      ? pathname === "/owner"
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
                    href="/owner/properties/new"
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    <Button className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                      <Plus className="h-4 w-4" />
                      Add Boarding House
                    </Button>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Seeker Discovery
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
