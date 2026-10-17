import * as React from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, Building2, Heart, ArrowUpRight, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/60 backdrop-blur-sm text-xs text-muted-foreground transition-colors">
      <div className="container mx-auto px-4 max-w-7xl py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-foreground">
                    Pabulong
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/10 font-medium"
                  >
                    Butuan City
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground leading-none">
                  Hyper-Local Student Rental Marketplace
                </span>
              </div>
            </Link>

            <p className="text-xs text-muted-foreground/90 leading-relaxed max-w-sm">
              Connecting university students, reviewees, and young professionals with verified student rentals, dormitories, and solo rooms across Butuan City.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Local Listings
              </span>
              <span>•</span>
              <span>Zero Broker Fees</span>
              <span>•</span>
              <span>Direct Landlord Rates</span>
            </div>
          </div>

          {/* Universities & Anchor Campuses */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Anchor Campuses
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/?campus=csu" className="hover:text-foreground transition-colors">
                  Caraga State Univ. (Ampayon)
                </Link>
              </li>
              <li>
                <Link href="/?campus=fsuu_main" className="hover:text-foreground transition-colors">
                  FSUU Main Campus
                </Link>
              </li>
              <li>
                <Link href="/?campus=fsuu_morelos" className="hover:text-foreground transition-colors">
                  FSUU Morelos Campus
                </Link>
              </li>
              <li>
                <Link href="/?campus=sjit" className="hover:text-foreground transition-colors">
                  SJIT Montilla
                </Link>
              </li>
              <li>
                <Link href="/?campus=bdc" className="hover:text-foreground transition-colors">
                  Butuan Doctors&apos; College
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Butuan Barangays */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Popular Barangays
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/?barangay=Libertad" className="hover:text-foreground transition-colors">
                  Barangay Libertad
                </Link>
              </li>
              <li>
                <Link href="/?barangay=Ampayon" className="hover:text-foreground transition-colors">
                  Barangay Ampayon
                </Link>
              </li>
              <li>
                <Link href="/?barangay=Villa+Kananga" className="hover:text-foreground transition-colors">
                  Barangay Villa Kananga
                </Link>
              </li>
              <li>
                <Link href="/?barangay=Doongan" className="hover:text-foreground transition-colors">
                  Barangay Doongan
                </Link>
              </li>
              <li>
                <Link href="/?barangay=San+Vicente" className="hover:text-foreground transition-colors">
                  Barangay San Vicente
                </Link>
              </li>
            </ul>
          </div>

          {/* Landlord & Operations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Portals & Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/owner" className="hover:text-foreground transition-colors flex items-center gap-1">
                  Landlord Command Center
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/owner/properties/new" className="hover:text-foreground transition-colors">
                  List Your Boarding House
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Heart className="h-3 w-3 text-rose-500" />
                  Saved Bookmarks
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Workspace & Kanban
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Pabulong. Serving Butuan City, 8600.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-muted-foreground/80">Philippine Peso (₱ / PHP)</span>
            <span>•</span>
            <span className="text-primary font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
