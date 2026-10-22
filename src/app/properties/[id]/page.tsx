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
  Bed,
  Building2,
} from "lucide-react";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { InquiryDialog } from "@/components/marketplace/inquiry-dialog";
import { getListingById, checkIsFavoritedAction } from "@/actions/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PropertyLocationMap } from "@/components/properties/property-location-map";
import { PropertyImage } from "@/components/ui/property-image";
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
    coed: { label: "Co-ed", color: "bg-secondary text-secondary-foreground border-border/80" },
  }[house.gender_restriction] || { label: "Co-ed", color: "bg-secondary text-secondary-foreground border-border/80" };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <MarketplaceNavbar />

      <main className="flex-1 pb-16">
        {/* Navigation Breadcrumb Bar */}
        <div className="border-b border-border/60 bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center justify-between">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2 rounded-lg"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
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
                className="h-8 text-xs rounded-lg border-border/80"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
          {/* Header & Badges */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  {house.featured && (
                    <Badge className="bg-amber-500 text-black text-xs font-semibold gap-1 px-2.5 py-0.5 rounded-full shadow-xs">
                      <Sparkles className="h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  )}
                  {house.is_verified && (
                    <Badge className="bg-primary text-primary-foreground text-xs font-semibold gap-1 px-2.5 py-0.5 rounded-full shadow-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Boarding House
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs px-2.5 py-0.5 rounded-full ${genderLabel.color}`}>
                    {genderLabel.label}
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {house.name}
                </h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>Barangay {house.barangay}, Butuan City</span>
                  </div>
                  <span>•</span>
                  <span>{house.address}</span>
                  {house.postal_code && <span>(ZIP: {house.postal_code})</span>}
                </div>
              </div>

              {/* Price Callout in Header */}
              <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 sm:text-right shrink-0 shadow-sm space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">Starting Monthly Rent</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {house.min_rent ? (
                    <>
                      <span className="text-primary font-extrabold">₱{house.min_rent.toLocaleString()}</span>
                      <span className="text-xs font-normal text-muted-foreground"> /mo</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium">Contact for rates</span>
                  )}
                </div>
                <div className="pt-2">
                  <InquiryDialog
                    house={house}
                    triggerButton={
                      <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs h-9 rounded-lg shadow-xs">
                        Inquire Directly
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 rounded-2xl overflow-hidden border border-border/70 shadow-sm">
              <div className="md:col-span-2 relative aspect-[16/10] bg-muted overflow-hidden">
                <PropertyImage
                  src={coverUrl}
                  alt={house.name}
                  fill
                  priority={true}
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-3.5">
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                  <PropertyImage
                    src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80"
                    alt={`${house.name} interior space`}
                    fill
                    priority={false}
                    sizes="33vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                  <PropertyImage
                    src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
                    alt={`${house.name} room view`}
                    fill
                    priority={false}
                    sizes="33vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Details (Left 2 cols) & Sticky Action Sidebar (Right 1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description Section */}
              <section className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  About this Boarding House
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {house.description}
                </p>
              </section>

              <Separator className="border-border/60" />

              {/* Available Rooms & Rates Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Bed className="h-5 w-5 text-primary" />
                      Rooms & Rental Rates
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Monthly rates in Philippine Pesos (₱). All utilities according to house rules.
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
                          className={`border rounded-2xl transition-all ${
                            room.is_available
                              ? "border-border/80 bg-card/80 shadow-xs hover:border-primary/50"
                              : "border-border/40 bg-muted/20 opacity-75"
                          } p-5 space-y-3.5`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                                Room {room.room_number}
                              </span>
                              <h3 className="font-bold text-base capitalize text-foreground mt-0.5">
                                {room.room_type} Room
                              </h3>
                            </div>
                            <Badge
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                room.is_available
                                  ? "bg-primary text-primary-foreground font-semibold"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {room.is_available ? "Available" : "Occupied"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-border/50">
                            <div>
                              <span className="text-muted-foreground block text-[11px]">Monthly Rent</span>
                              <span className="font-extrabold text-primary text-base">
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
                              <span className="text-foreground">Level {room.floor_level || 1}</span>
                            </div>
                          </div>

                          {room.features && room.features.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {room.features.map((feat, fidx) => (
                                <span
                                  key={fidx}
                                  className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium"
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
                                  className="w-full text-xs h-8 gap-1.5 rounded-lg border-border"
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
                  <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center text-muted-foreground text-xs space-y-1">
                    <p className="font-semibold text-foreground">No specific room configurations listed.</p>
                    <p>Send an inquiry to the landlord to check current vacancies.</p>
                  </div>
                )}
              </section>

              <Separator className="border-border/60" />

              {/* Amenities Checklist */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Amenities & Facilities
                </h2>
                {house.amenities && house.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {house.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-border/70 bg-card/60 text-xs font-medium text-foreground shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Standard residential utilities included.</p>
                )}
              </section>

              <Separator className="border-border/60" />

              {/* House Policies & Curfew */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  House Policies & Curfews
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {house.curfew_policy && (
                    <div className="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Curfew Policy</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {house.curfew_policy}
                      </p>
                    </div>
                  )}

                  {house.visitor_policy && (
                    <div className="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
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
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
                      Rules & House Regulations
                    </span>
                    <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                      {house.rules.map((rule, idx) => (
                        <li key={idx} className="leading-relaxed">{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Location & Neighborhood Map Section */}
              <PropertyLocationMap house={house} />
            </div>

            {/* Sidebar (Right Col) */}
            <div className="space-y-6">
              {/* Sticky Action Card */}
              <Card className="sticky top-20 border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">
                    Direct Landlord Booking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Direct inquiries connect you with the verified landlord or dorm caretaker in Butuan without brokerage fees.
                  </p>

                  <InquiryDialog
                    house={house}
                    triggerButton={
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-11 text-xs sm:text-sm rounded-xl shadow-sm">
                        Send Inquiry to Landlord
                      </Button>
                    }
                  />

                  <FavoriteButton
                    boardingHouseId={house.id}
                    initialFavorited={isFavorited}
                    variant="outline"
                    showText={true}
                    className="w-full h-10 text-xs rounded-xl border-border/80"
                  />

                  <Separator className="border-border/60" />

                  {/* Landlord Contact Card */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                      Landlord Information
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0">
                        {house.owner?.full_name ? house.owner.full_name.charAt(0).toUpperCase() : "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-foreground">
                            {house.owner?.full_name || "Verified Landlord"}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                          Operating in Barangay {house.barangay}
                        </span>
                      </div>
                    </div>

                    {house.contact_phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        <span>{house.contact_phone}</span>
                      </div>
                    )}
                    {house.contact_email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <span>{house.contact_email}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="border-border/60" />

                  {/* Safety & Trust Note */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Butuan Safety Verified</span>
                    </div>
                    <p className="leading-relaxed">
                      Always inspect rooms in person before releasing deposits. Pabulong encourages on-site viewings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
