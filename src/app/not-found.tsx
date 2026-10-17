import Link from "next/link";
import { Compass, Home, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketplaceNavbar />
      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Compass className="h-10 w-10 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-widest">
              Error 404 • Page Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Off the Campus Map
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The boarding house or page you are looking for may have been moved, unlisted, or does not exist in Butuan City.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                <Home className="h-4 w-4" />
                Return to Discovery
              </Button>
            </Link>
            <Link href="/owner" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2 border-border/80">
                <Building2 className="h-4 w-4 text-primary" />
                Landlord Portal
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
}
