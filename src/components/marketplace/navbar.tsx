"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Heart,
  Building2,
  Menu,
  Plus,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function MarketplaceNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navLinks = [
    { href: "/", label: "Discover", icon: Compass },
    { href: "/saved", label: "Saved", icon: Heart },
    { href: "/owner", label: "Landlord Portal", icon: Building2 },
    { href: "/dashboard", label: "Workspace", icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-colors">
      <div className="container mx-auto px-4 h-16 max-w-7xl flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm shadow-primary/25 group-hover:scale-105 transition-transform">
            P
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-foreground">
                Pabulong
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/10 font-medium hidden sm:inline-flex"
              >
                Butuan City
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground hidden md:inline leading-none">
              Student Housing & Boarding Houses
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-2 h-9 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {link.label}
                  {link.href === "/saved" && (
                    <span className="sr-only">Saved listings</span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Clerk Authenticated State */}
          <SignedIn>
            <div className="flex items-center gap-2.5">
              <Link href="/saved" className="hidden sm:inline-flex">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Saved Listings"
                  className={`h-9 w-9 rounded-lg ${
                    pathname === "/saved" ? "bg-secondary text-rose-500" : "text-muted-foreground hover:text-rose-500"
                  }`}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/owner/properties/new" className="hidden lg:inline-flex">
                <Button
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-medium rounded-lg shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  List Property
                </Button>
              </Link>

              <div className="pl-1">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8 ring-2 ring-border/80 hover:ring-primary/60 transition-all",
                    },
                  }}
                />
              </div>
            </div>
          </SignedIn>

          {/* Clerk Unauthenticated State */}
          <SignedOut>
            <div className="hidden sm:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  Sign In
                </Button>
              </SignInButton>

              <SignUpButton mode="modal">
                <Button
                  size="sm"
                  className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg shadow-xs"
                >
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          {/* Mobile Sheet Navigation */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:hidden rounded-lg border-border/80"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-6 flex flex-col justify-between bg-card border-border/80">
              <div className="space-y-6">
                <SheetHeader className="text-left pb-4 border-b border-border/60">
                  <SheetTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
                    <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-xs">
                      P
                    </div>
                    <span>Pabulong Butuan</span>
                  </SheetTitle>
                </SheetHeader>

                {/* Primary Nav Links */}
                <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      link.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start gap-3 h-10 text-xs font-medium rounded-lg ${
                            isActive
                              ? "bg-secondary text-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>

                {/* Landlord Shortcut Banner */}
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Boarding House Owner?
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    List student dorms, solo rooms, and bedspaces in Butuan City directly to prospective renters.
                  </p>
                  <Link
                    href="/owner/properties/new"
                    onClick={() => setMobileOpen(false)}
                    className="block pt-1"
                  >
                    <Button size="sm" className="w-full text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="h-3.5 w-3.5" />
                      Add Boarding House
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Mobile Auth Drawer Footer */}
              <div className="border-t border-border/60 pt-4">
                <SignedOut>
                  <div className="flex flex-col gap-2">
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full h-9 text-xs">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                        Create Free Account
                      </Button>
                    </SignUpButton>
                  </div>
                </SignedOut>

                <SignedIn>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-foreground">Logged In</span>
                      <span className="text-[11px] text-muted-foreground">Manage profile</span>
                    </div>
                    <UserButton />
                  </div>
                </SignedIn>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
