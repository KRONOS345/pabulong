import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, MapPin } from "lucide-react";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6 relative">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discovery
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6 text-center">
        {/* Brand Header */}
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mx-auto">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm shadow-primary/25">
              P
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-xl tracking-tight text-foreground">
                Pabulong
              </span>
              <span className="text-[11px] text-muted-foreground leading-none">
                Butuan City Rental Marketplace
              </span>
            </div>
          </Link>

          <p className="text-xs text-muted-foreground max-w-xs mx-auto pt-1">
            Create an account to discover student dormitories or list your boarding house in Butuan City.
          </p>
        </div>

        {/* Clerk Sign-up Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                card: "shadow-xl border border-border/80 bg-card rounded-2xl",
                headerTitle: "text-foreground font-bold",
                headerSubtitle: "text-muted-foreground text-xs",
                socialButtonsBlockButton: "rounded-xl border-border/80 text-foreground hover:bg-muted/50",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium",
                formFieldInput: "rounded-xl bg-background border-border/80 text-foreground",
                footerActionLink: "text-primary hover:text-primary/90 font-medium",
              },
            }}
          />
        </div>

        {/* Localized trust note */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Zero Agent Commission
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Butuan City, 8600
          </span>
        </div>
      </div>
    </main>
  );
}
