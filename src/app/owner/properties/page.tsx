import * as React from "react";
import Link from "next/link";
import { Building2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OwnerPropertyCard } from "@/components/owner/owner-property-card";
import { getOwnerPropertiesAction } from "@/actions/marketplace";

export const dynamic = "force-dynamic";

export default async function OwnerPropertiesPage() {
  const properties = await getOwnerPropertiesAction();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/owner"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Overview
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-emerald-500" />
            My Boarding Houses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your registered houses, configure room vacancies, and update house rules.
          </p>
        </div>

        <Link href="/owner/properties/new">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            Add Boarding House
          </Button>
        </Link>
      </div>

      {/* Property Cards Grid */}
      {properties.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-card/40 text-center py-16 px-4">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">
                No boarding houses registered
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You haven&apos;t added any boarding houses yet. Register your first property in Butuan City to start managing rooms and receiving seeker inquiries.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/owner/properties/new">
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Plus className="h-4 w-4" />
                  Register First Property
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <OwnerPropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
