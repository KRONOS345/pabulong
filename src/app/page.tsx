import { Metadata } from "next";
import Link from "next/link";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { DiscoveryFeed } from "@/components/marketplace/discovery-feed";
import { searchListings, getUserFavoriteIdsAction } from "@/actions/marketplace";
import { ShieldCheck, MapPin, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pabulong | Butuan City Boarding Houses & Rental Spaces",
  description:
    "Find student dormitories, solo rooms, bedspaces, and rental pads in Butuan City. Compare rates, check proximity to CSU & FSUU, and inquire directly with landlords.",
};

export default async function HomePage() {
  // Query real seeded listings from Supabase server-side
  const [initialListings, initialFavoriteIds] = await Promise.all([
    searchListings(),
    getUserFavoriteIdsAction().catch(() => []),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Marketplace Top Navigation */}
      <MarketplaceNavbar />

      <main className="flex-1">
        {/* Marketplace Hero & Discovery Header */}
        <section className="relative border-b border-border/60 bg-gradient-to-b from-muted/30 via-background to-background py-8 sm:py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="bg-emerald-950/40 text-emerald-400 border-emerald-500/40 px-2.5 py-0.5 text-xs font-medium gap-1.5"
                >
                  <MapPin className="h-3 w-3" />
                  Butuan City, Agusan del Norte
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs text-muted-foreground px-2.5 py-0.5"
                >
                  Student & Professional Housing
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Find Boarding Houses & Rentals in Butuan
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Discover verified solo rooms, shared bedspaces, and dormitories located near{" "}
                <span className="text-foreground font-medium">Caraga State University (CSU)</span>,{" "}
                <span className="text-foreground font-medium">FSUU Main & Morelos</span>, and downtown Butuan.
              </p>

              {/* Trust Indicators */}
              <div className="pt-2 flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Verified Landlords</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-400">₱ PHP</span>
                  <span>Direct Local Rates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-emerald-500" />
                  <span>Zero Agent Commissions</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Marketplace Feed Section */}
        <section className="container mx-auto px-4 max-w-7xl py-8">
          <DiscoveryFeed
            initialListings={initialListings}
            initialFavoriteIds={initialFavoriteIds}
          />
        </section>
      </main>

      {/* Localized Marketplace Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-8 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Pabulong</span>
            <span>— Butuan Housing Marketplace</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="hover:text-foreground transition-colors">
              Discover
            </Link>
            <Link href="/saved" className="hover:text-foreground transition-colors">
              Saved Favorites
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Landlord Portal
            </Link>
          </div>

          <div className="text-center sm:text-right">
            <span>© {new Date().getFullYear()} Pabulong. Serving Butuan City, 8600.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
