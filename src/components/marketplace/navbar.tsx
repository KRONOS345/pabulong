"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Building, Menu } from "lucide-react";
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
    { href: "/", label: "Discover", icon: Home },
    { href: "/saved", label: "Saved Listings", icon: Heart },
    { href: "/owner", label: "Landlord Portal", icon: Building },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-emerald-600/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            P
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-foreground">
                Pabulong
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-400 bg-emerald-950/30 hidden sm:inline-flex">
                Butuan
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline leading-none">
              Boarding Houses & Rental Spaces
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-2 h-9 text-sm font-medium ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center gap-2">
          {/* Clerk Authenticated State */}
          <SignedIn>
            <div className="flex items-center gap-3">
              <Link href="/saved" className="hidden sm:inline-flex">
                <Button variant="ghost" size="icon" aria-label="View Saved Listings" className="h-9 w-9">
                  <Heart className="h-4 w-4 text-muted-foreground hover:text-rose-500 transition-colors" />
                </Button>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 ring-1 ring-border",
                  },
                }}
              />
            </div>
          </SignedIn>

          {/* Clerk Unauthenticated State */}
          <SignedOut>
            <div className="hidden sm:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="h-9 text-sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-500 text-white">
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
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:hidden"
                  aria-label="Open mobile menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-6 flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                    <span className="h-7 w-7 rounded bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-sm">
                      P
                    </span>
                    Pabulong Butuan
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-2" aria-label="Mobile Navigation">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3 h-11 text-sm font-medium"
                        >
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t pt-4">
                <SignedOut>
                  <div className="flex flex-col gap-2">
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full h-10">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white">
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Account</span>
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
