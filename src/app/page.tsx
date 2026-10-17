import { Metadata } from "next";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { DiscoveryFeed } from "@/components/marketplace/discovery-feed";
import { searchListings, getUserFavoriteIdsAction } from "@/actions/marketplace";
import { ShieldCheck, MapPin, Building2, GraduationCap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pabulong | Butuan City Boarding Houses, Dorms & Student Rentals",
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
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {/* Marketplace Top Navigation */}
      <MarketplaceNavbar />

      <main className="flex-1">
        {/* Marketplace Hero & Discovery Header */}
        <section className="relative border-b border-border/70 overflow-hidden bg-gradient-to-b from-primary/10 via-background/80 to-background py-10 sm:py-16">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/5 blur-3xl pointer-events-none rounded-full" />

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 px-3 py-1 text-xs font-semibold gap-1.5 rounded-full shadow-xs"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Butuan City, Agusan del Norte
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs text-muted-foreground px-3 py-1 rounded-full font-medium"
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1 text-primary" />
                  Student & Professional Housing
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Find Boarding Houses & Rentals in Butuan
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Browse verified solo rooms, shared bedspaces, and dormitories located walking distance or 1-tricycle ride from{" "}
                <span className="text-foreground font-semibold">Caraga State University (CSU)</span>,{" "}
                <span className="text-foreground font-semibold">FSUU Main & Morelos</span>,{" "}
                <span className="text-foreground font-semibold">SJIT</span>, and downtown Butuan.
              </p>

              {/* Trust Indicators */}
              <div className="pt-3 flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Verified Landlords</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="font-bold text-primary">₱ PHP</span>
                  <span>Direct Local Rates</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Zero Broker Fees</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Direct Chat & Viewing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Marketplace Feed Section */}
        <section className="container mx-auto px-4 max-w-7xl py-8 sm:py-12">
          <DiscoveryFeed
            initialListings={initialListings}
            initialFavoriteIds={initialFavoriteIds}
          />
        </section>
      </main>

      {/* Shared Marketplace Footer */}
      <MarketplaceFooter />
    </div>
  );
}
