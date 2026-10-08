/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  SlidersHorizontal,
  Edit,
  ExternalLink,
  ArrowLeft,
  Bed,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOwnerPropertyByIdAction } from "@/actions/marketplace";

export const dynamic = "force-dynamic";

interface OwnerPropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerPropertyDetailPage({
  params,
}: OwnerPropertyDetailPageProps) {
  const { id } = await params;
  const property = await getOwnerPropertyByIdAction(id);

  if (!property) {
    notFound();
  }

  const rooms = property.rooms || [];
  const roomCount = rooms.length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const availableBeds = rooms.reduce(
    (acc, r) =>
      acc +
      (r.available_beds !== undefined
        ? r.available_beds
        : r.is_available
        ? r.capacity
        : 0),
    0
  );

  const coverUrl =
    property.cover_image_url ||
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          href="/owner/properties"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Boarding Houses
        </Link>
      </div>

      {/* Property Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-card">
        <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full bg-muted overflow-hidden">
          <img
            src={coverUrl}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="bg-black/60 backdrop-blur text-white border-white/20 text-xs px-2.5 py-1 gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {property.barangay}, Butuan City
            </Badge>

            <Badge
              className={`text-xs px-2.5 py-1 capitalize font-medium ${
                property.status === "published"
                  ? "bg-emerald-600 text-white"
                  : property.status === "draft"
                  ? "bg-amber-600 text-white"
                  : "bg-zinc-700 text-zinc-200"
              }`}
            >
              {property.status}
            </Badge>
          </div>

          {/* Bottom Title & Action CTA */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="space-y-1 max-w-xl">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                {property.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/80">
                {property.address}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <Link href={`/owner/properties/${property.id}/rooms`}>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Manage Rooms & Rates
                </Button>
              </Link>

              <Link href={`/owner/properties/${property.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-black/40 text-white border-white/30 hover:bg-white/10 text-xs h-9"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Property
                </Button>
              </Link>

              {property.status === "published" && (
                <Link
                  href={`/properties/${property.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-black/40 text-white border-white/30 hover:bg-white/10 text-xs h-9"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Public View
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Room Units
            </span>
            <div className="text-2xl font-bold text-foreground">
              {roomCount}
            </div>
            <p className="text-xs text-muted-foreground">Configured rooms</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Capacity
            </span>
            <div className="text-2xl font-bold text-foreground">
              {totalCapacity} pax
            </div>
            <p className="text-xs text-muted-foreground">Total boarder capacity</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Available Beds
            </span>
            <div className={`text-2xl font-bold ${availableBeds > 0 ? "text-emerald-500" : "text-amber-500"}`}>
              {availableBeds} beds
            </div>
            <p className="text-xs text-muted-foreground">Currently vacant</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Gender Policy
            </span>
            <div className="text-lg font-bold text-foreground capitalize">
              {property.gender_restriction.replace("_", " ")}
            </div>
            <p className="text-xs text-muted-foreground">House restriction</p>
          </CardContent>
        </Card>
      </div>

      {/* Room Inventory Overview */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bed className="h-4 w-4 text-emerald-500" />
              Room Inventory Overview
            </CardTitle>
            <CardDescription className="text-xs">
              Summary of all rooms registered to this boarding house
            </CardDescription>
          </div>

          <Link href={`/owner/properties/${property.id}/rooms`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
              <SlidersHorizontal className="h-3 w-3" />
              Manage All Rooms
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
              <p>No rooms added yet to this boarding house.</p>
              <Link href={`/owner/properties/${property.id}/rooms`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Add Room Unit Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        Room {room.room_number}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-normal">
                        {room.room_type}
                      </Badge>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${
                          room.is_available
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {room.is_available ? "Available" : "Occupied"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Capacity: {room.capacity} pax • Vacancy: {room.available_beds} beds left
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-foreground text-sm">
                      ₱{room.monthly_rent.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">/ month</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* House Policies & Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              House Rules & Curfews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {property.curfew_policy && (
              <div>
                <span className="font-semibold text-foreground">Curfew:</span>{" "}
                <span className="text-muted-foreground">{property.curfew_policy}</span>
              </div>
            )}
            {property.visitor_policy && (
              <div>
                <span className="font-semibold text-foreground">Visitors:</span>{" "}
                <span className="text-muted-foreground">{property.visitor_policy}</span>
              </div>
            )}
            {property.rules && property.rules.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-foreground block">Rules:</span>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground pl-1">
                  {property.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Amenities & Utilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((amenity, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs bg-muted/50 border-border text-foreground px-2.5 py-1"
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No amenities listed. Click Edit to add Wi-Fi, air conditioning, and other features.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
