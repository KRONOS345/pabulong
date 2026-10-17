import { Metadata } from "next";
import Link from "next/link";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { ListingCard } from "@/components/marketplace/listing-card";
import { getSeekerFavoritesAction } from "@/actions/marketplace";
import { Heart, ArrowLeft, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Saved Boarding Houses | Pabulong Butuan",
  description: "View and manage your bookmarked student dormitories and boarding houses in Butuan City.",
};

export default async function SavedListingsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <MarketplaceNavbar />
        <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-16">
          <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <Heart className="h-8 w-8 fill-current" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in to view saved listings</h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Bookmark and compare your top student boarding houses, solo rooms, and bedspaces across Butuan City.
              </p>
            </div>
            <div className="pt-2">
              <SignInButton mode="modal">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-10 rounded-xl shadow-xs">
                  Sign In to Pabulong
                </Button>
              </SignInButton>
            </div>
          </div>
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  const favorites = await getSeekerFavoritesAction();
  const savedHouses = favorites
    .map((f) => f.boarding_house)
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 max-w-7xl py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Discover
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Heart className="h-6 w-6 text-rose-500 fill-current" />
              Saved Boarding Houses
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {savedHouses.length} bookmarked propert{savedHouses.length === 1 ? "y" : "ies"} in Butuan City
            </p>
          </div>

          {savedHouses.length > 0 && (
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 text-xs h-9 rounded-lg">
                <Compass className="h-3.5 w-3.5 text-primary" />
                Browse More Rentals
              </Button>
            </Link>
          )}
        </div>

        {/* Empty State */}
        {savedHouses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-20 px-4 text-center space-y-4 max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Heart className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-lg text-foreground">No saved boarding houses yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Click the heart icon on any boarding house card while browsing to bookmark it for fast comparisons and inquiries.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/">
                <Button className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-9 rounded-lg shadow-xs">
                  <Search className="h-3.5 w-3.5" />
                  Browse Butuan Listings
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedHouses.map((house) => (
              <ListingCard
                key={house.id}
                house={house}
                isFavorited={true}
              />
            ))}
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
}
