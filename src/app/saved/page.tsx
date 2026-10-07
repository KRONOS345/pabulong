import { Metadata } from "next";
import Link from "next/link";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { ListingCard } from "@/components/marketplace/listing-card";
import { getSeekerFavoritesAction } from "@/actions/marketplace";
import { Heart, ArrowLeft, Search } from "lucide-react";
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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <MarketplaceNavbar />
        <main className="flex-1 container mx-auto px-4 max-w-4xl py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Heart className="h-8 w-8 text-rose-500/70" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to view saved listings</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Create an account or sign in to save your favorite boarding houses and access them anytime.
          </p>
          <div className="pt-2">
            <SignInButton mode="modal">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                Sign In to Pabulong
              </Button>
            </SignInButton>
          </div>
        </main>
      </div>
    );
  }

  const favorites = await getSeekerFavoritesAction();
  const savedHouses = favorites
    .map((f) => f.boarding_house)
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 max-w-7xl py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Discover
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              Saved Boarding Houses
            </h1>
            <p className="text-xs text-muted-foreground">
              {savedHouses.length} saved propert{savedHouses.length === 1 ? "y" : "ies"} in Butuan City
            </p>
          </div>
        </div>

        {savedHouses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 px-4 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">No saved boarding houses yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Click the heart icon on any boarding house card to bookmark it for quick access later.
              </p>
            </div>
            <Link href="/">
              <Button className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                <Search className="h-3.5 w-3.5" />
                Browse Butuan Listings
              </Button>
            </Link>
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
    </div>
  );
}
