import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Users,
  Shield,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { InquiryDialog } from "@/components/marketplace/inquiry-dialog";
import { getListingById, checkIsFavoritedAction } from "@/actions/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Room } from "@/lib/marketplace-types";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const house = await getListingById(id);

  if (!house) {
    return { title: "Listing Not Found | Pabulong" };
  }

  return {
    title: `${house.name} | Pabulong Butuan`,
    description: house.description,
  };
}

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const house = await getListingById(id);

  if (!house) {
    notFound();
  }

  const isFavorited = await checkIsFavoritedAction(house.id).catch(() => false);

  const defaultPhoto =
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80";
  const coverUrl = house.cover_image_url || defaultPhoto;

  const genderLabel = {
    male_only: { label: "Male Only", color: "bg-blue-950/60 text-blue-400 border-blue-500/40" },
    female_only: { label: "Female Only", color: "bg-pink-950/60 text-pink-400 border-pink-500/40" },
    coed: { label: "Co-ed", color: "bg-purple-950/60 text-purple-400 border-purple-500/40" },
  }[house.gender_restriction] || { label: "Co-ed", color: "bg-muted text-muted-foreground" };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketplaceNavbar />

      <main className="flex-1 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="border-b border-border/50 bg-muted/10">
          <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to All Listings
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <FavoriteButton
                boardingHouseId={house.id}
                initialFavorited={isFavorited}
                size="sm"
                variant="outline"
                showText={true}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-6 space-y-8">
          {/* Photos & Header Overview */}
          <div className="space-y-4">
            {/* Title & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {house.featured && (
                    <Badge className="bg-amber-500 text-black text-xs font-semibold gap-1">
                      <Sparkles className="h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  )}
                  {house.is_verified && (
                    <Badge className="bg-emerald-600 text-white text-xs font-medium gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Boarding House
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${genderLabel.color}`}>
                    {genderLabel.label}
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {house.name}
                </h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>Barangay {house.barangay}, Butuan City</span>
                  </div>
                  <span>•</span>
                  <span>{house.address}</span>
                  {house.postal_code && <span>(Postal: {house.postal_code})</span>}
                </div>
              </div>

              {/* Price Callout */}
              <div className="bg-muted/30 border border-border/80 rounded-xl p-4 sm:text-right shrink-0">
                <span className="text-xs text-muted-foreground block">Starting rate</span>
                <div className="text-2xl font-extrabold text-emerald-400">
                  {house.min_rent ? (
                    <>₱{house.min_rent.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ month</span></>
                  ) : (
                    <span className="text-sm font-medium">Contact for rates</span>
                  )}
                </div>
                <div className="mt-2">
                  <InquiryDialog
                    house={house}
                    triggerButton={
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-8">
                        Inquire Now
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden">
              <div className="md:col-span-2 relative aspect-[16/10] md:aspect-[16/10] bg-muted overflow-hidden">
                <img
                  src={coverUrl}
                  alt={house.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-3">
                <div className="relative aspect-[16/10] bg-muted overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80"
                    alt={`${house.name} interior`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative aspect-[16/10] bg-muted overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
                    alt={`${house.name} room view`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Details (Left 2 cols) & Sidebar (Right 1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description Section */}
              <section className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  About this Property
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {house.description}
                </p>
              </section>

              <Separator />

              {/* Available Rooms & Rates Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Rooms & Rental Rates
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Monthly rates in Philippine Pesos (₱ / PHP). Contact landlord to reserve a slot.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {house.rooms?.length || 0} Room Configuration{house.rooms?.length === 1 ? "" : "s"}
                  </Badge>
                </div>

                {house.rooms && house.rooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {house.rooms.map((room: Room) => {
                      return (
                        <Card
                          key={room.id}
                          className={`border ${
                            room.is_available
                              ? "border-border/80 bg-card/60"
                              : "border-border/40 bg-muted/20 opacity-75"
                          } p-4 space-y-3`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                Room {room.room_number}
                              </span>
                              <h3 className="font-bold text-base capitalize text-foreground">
                                {room.room_type} Room
                              </h3>
                            </div>
                            <Badge
                              className={`text-[10px] ${
                                room.is_available
                                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {room.is_available ? "Available" : "Fully Occupied"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/50">
                            <div>
                              <span className="text-muted-foreground block text-[11px]">Monthly Rent</span>
                              <span className="font-bold text-emerald-400 text-sm">
                                ₱{room.monthly_rent.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[11px]">Beds Available</span>
                              <span className="font-medium text-foreground">
                                {room.available_beds} of {room.capacity} slots
                              </span>
                            </div>
                            {room.security_deposit > 0 && (
                              <div>
                                <span className="text-muted-foreground block text-[11px]">Security Deposit</span>
                                <span className="text-foreground">
                                  ₱{room.security_deposit.toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground block text-[11px]">Floor Level</span>
                              <span className="text-foreground">Level {room.floor_level}</span>
                            </div>
                          </div>

                          {room.features && room.features.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {room.features.map((feat, fidx) => (
                                <span
                                  key={fidx}
                                  className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground"
                                >
                                  {feat}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="pt-1">
                            <InquiryDialog
                              house={house}
                              selectedRoomId={room.id}
                              triggerButton={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!room.is_available}
                                  className="w-full text-xs h-8 gap-1.5"
                                >
                                  Inquire for Room {room.room_number}
                                </Button>
                              }
                            />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed text-center text-muted-foreground text-sm">
                    No specific room units listed. Please send an inquiry directly to check current vacancies.
                  </div>
                )}
              </section>

              <Separator />

              {/* Amenities Checklist */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Amenities & Facilities
                </h2>
                {house.amenities && house.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {house.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs font-medium text-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Standard residential amenities included.</p>
                )}
              </section>

              <Separator />

              {/* House Policies & Curfew */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  House Policies & Rules
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {house.curfew_policy && (
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Curfew Policy</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {house.curfew_policy}
                      </p>
                    </div>
                  )}

                  {house.visitor_policy && (
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>Visitor Policy</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {house.visitor_policy}
                      </p>
                    </div>
                  )}
                </div>

                {house.rules && house.rules.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Rules & Regulations
                    </span>
                    <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                      {house.rules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar (Right Col) */}
            <div className="space-y-6">
              {/* Sticky Action Card */}
              <Card className="sticky top-20 border-border/80 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">
                    Interested in this Boarding House?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Direct inquiries connect you with the landlord or dorm caretaker in Butuan without brokerage fees.
                  </p>

                  <InquiryDialog
                    house={house}
                    triggerButton={
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-11 text-sm shadow-sm">
                        Send Inquiry to Landlord
                      </Button>
                    }
                  />

                  <FavoriteButton
                    boardingHouseId={house.id}
                    initialFavorited={isFavorited}
                    variant="outline"
                    showText={true}
                    className="w-full h-10 text-xs"
                  />

                  <Separator />

                  {/* Landlord Contact Card */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Landlord Information
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                        {house.owner?.full_name ? house.owner.full_name.charAt(0) : "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground">
                            {house.owner?.full_name || "Verified Landlord"}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                          Operating in Barangay {house.barangay}
                        </span>
                      </div>
                    </div>

                    {house.contact_phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{house.contact_phone}</span>
                      </div>
                    )}
                    {house.contact_email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{house.contact_email}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Safety & Trust Note */}
                  <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Butuan Safety Verified</span>
                    </div>
                    <p>
                      Never send cash deposits outside Pabulong or before viewing the boarding house in person.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
