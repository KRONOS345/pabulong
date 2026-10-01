"use client";

import * as React from "react";
import {
  Building,
  Plus,
  Users,
  MapPin,
  CheckCircle2,
  Bed,
  Map as MapIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchProperties,
  createBoardingHouseAction,
  createRoomAction,
} from "@/actions/properties";
import { type BoardingHouseItem } from "@/lib/property-types";
import { InteractiveMap } from "@/components/properties/interactive-map";
import { toast } from "sonner";

export default function PropertiesPage() {
  const [properties, setProperties] = React.useState<BoardingHouseItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = React.useState<string | null>(null);
  const [showMapView, setShowMapView] = React.useState(true);

  // New House Dialog State
  const [isHouseDialogOpen, setIsHouseDialogOpen] = React.useState(false);
  const [houseName, setHouseName] = React.useState("");
  const [houseAddress, setHouseAddress] = React.useState("");
  const [houseDescription, setHouseDescription] = React.useState("");
  const [houseAmenities, setHouseAmenities] = React.useState("Fiber Wi-Fi, Generator Backup, Study Pods");
  const [houseRules, setHouseRules] = React.useState("Curfew 10PM, No Smoking, Quiet Hours after 9PM");
  const [houseEmail, setHouseEmail] = React.useState("");
  const [housePhone, setHousePhone] = React.useState("");
  const [submittingHouse, setSubmittingHouse] = React.useState(false);

  // New Room Dialog State
  const [isRoomDialogOpen, setIsRoomDialogOpen] = React.useState(false);
  const [targetHouseId, setTargetHouseId] = React.useState<string>("");
  const [roomNumber, setRoomNumber] = React.useState("");
  const [capacity, setCapacity] = React.useState("1");
  const [monthlyRent, setMonthlyRent] = React.useState("350");
  const [genderPreference, setGenderPreference] = React.useState<"male" | "female" | "any">("any");
  const [roomFeatures, setRoomFeatures] = React.useState("Ensuite Bath, Aircon, Desk & Chair");
  const [submittingRoom, setSubmittingRoom] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    fetchProperties().then((data) => {
      if (!ignore) {
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId((prev) => prev ?? data[0].id);
        }
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseName.trim() || !houseAddress.trim()) return;

    setSubmittingHouse(true);
    const amenitiesArr = houseAmenities.split(",").map((s) => s.trim()).filter(Boolean);
    const rulesArr = houseRules.split(",").map((s) => s.trim()).filter(Boolean);

    const res = await createBoardingHouseAction({
      name: houseName,
      address: houseAddress,
      description: houseDescription || "Verified student and professional residence.",
      amenities: amenitiesArr,
      rules: rulesArr,
      contact_email: houseEmail || "contact@pabulong.io",
      contact_phone: housePhone || "+1 (555) 012-3456",
    });

    if (res.success && res.property) {
      setProperties((prev) => [res.property!, ...prev]);
      setSelectedPropertyId(res.property.id);
      setIsHouseDialogOpen(false);
      setHouseName("");
      setHouseAddress("");
      setHouseDescription("");
      toast.success(`Boarding house "${res.property.name}" registered`);
    } else {
      toast.error(res.error || "Failed to register boarding house");
    }
    setSubmittingHouse(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHouseId || !roomNumber.trim()) return;

    setSubmittingRoom(true);
    const featuresArr = roomFeatures.split(",").map((s) => s.trim()).filter(Boolean);

    const res = await createRoomAction({
      boarding_house_id: targetHouseId,
      room_number: roomNumber,
      capacity: Number(capacity) || 1,
      monthly_rent: Number(monthlyRent) || 300,
      status: "available",
      gender_preference: genderPreference,
      features: featuresArr,
    });

    if (res.success && res.room) {
      setProperties((prev) =>
        prev.map((house) =>
          house.id === targetHouseId
            ? { ...house, rooms: [...(house.rooms || []), res.room!] }
            : house
        )
      );
      setIsRoomDialogOpen(false);
      setRoomNumber("");
      setCapacity("1");
      setMonthlyRent("350");
      toast.success(`Room Unit ${res.room.room_number} added`);
    } else {
      toast.error(res.error || "Failed to create room");
    }
    setSubmittingRoom(false);
  };

  // Aggregated Stats
  const totalRooms = properties.reduce((acc, h) => acc + (h.rooms?.length || 0), 0);
  const availableRooms = properties.reduce(
    (acc, h) => acc + (h.rooms?.filter((r) => r.status === "available").length || 0),
    0
  );
  const occupiedRooms = properties.reduce(
    (acc, h) => acc + (h.rooms?.filter((r) => r.status === "occupied").length || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            Properties & Geolocation Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            PostGIS spatial mapping, room capacity monitoring, and student housing directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Map View Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMapView(!showMapView)}
            className="gap-2 text-xs"
          >
            <MapIcon className="h-3.5 w-3.5" />
            {showMapView ? "Hide Split Map" : "Show Split Map"}
          </Button>

          {/* New House Dialog */}
          <Dialog open={isHouseDialogOpen} onOpenChange={setIsHouseDialogOpen}>
            <DialogTrigger 
              render={
                <Button className="gap-2 text-xs" />
              }
            >
              <Plus className="h-4 w-4" />
              Add Boarding House
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Register Boarding House</DialogTitle>
                <DialogDescription>
                  Creates a verified property listing enabled for PostGIS radius matching.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateHouse} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="house-name">Property Name</Label>
                  <Input
                    id="house-name"
                    placeholder="e.g. Apex Student Residences Block C"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="house-address">Address / Location</Label>
                  <Input
                    id="house-address"
                    placeholder="e.g. 74 University Ave, Near North Gate"
                    value={houseAddress}
                    onChange={(e) => setHouseAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="house-description">Description</Label>
                  <Input
                    id="house-description"
                    placeholder="Brief description of the facility"
                    value={houseDescription}
                    onChange={(e) => setHouseDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="house-amenities">Amenities (comma-separated)</Label>
                  <Input
                    id="house-amenities"
                    placeholder="Fiber Wi-Fi, CCTV, Backup Generator"
                    value={houseAmenities}
                    onChange={(e) => setHouseAmenities(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="house-rules">House Rules (comma-separated)</Label>
                  <Input
                    id="house-rules"
                    placeholder="10PM Curfew, No Smoking, Visitor Logs"
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="house-email">Contact Email</Label>
                    <Input
                      id="house-email"
                      type="email"
                      placeholder="desk@residence.edu"
                      value={houseEmail}
                      onChange={(e) => setHouseEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="house-phone">Contact Phone</Label>
                    <Input
                      id="house-phone"
                      placeholder="+1 (555) 019-9922"
                      value={housePhone}
                      onChange={(e) => setHousePhone(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHouseDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingHouse}>
                    {submittingHouse ? "Saving..." : "Save Property"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* New Room Dialog */}
          <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
            <DialogTrigger 
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => {
                    if (properties.length > 0 && !targetHouseId) {
                      setTargetHouseId(properties[0].id);
                    }
                  }}
                />
              }
            >
              <Plus className="h-4 w-4" />
              Add Room
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Room Unit</DialogTitle>
                <DialogDescription>
                  Adds an inventory room slot linked to a verified boarding house.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateRoom} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="room-house">Boarding House</Label>
                  <select
                    id="room-house"
                    value={targetHouseId}
                    onChange={(e) => setTargetHouseId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    {properties.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="room-unit">Unit / Room #</Label>
                    <Input
                      id="room-unit"
                      placeholder="e.g. Unit 302"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="room-capacity">Max Capacity</Label>
                    <Input
                      id="room-capacity"
                      type="number"
                      min="1"
                      max="8"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="room-rent">Rent ($/month)</Label>
                    <Input
                      id="room-rent"
                      type="number"
                      min="50"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="room-gender">Gender Policy</Label>
                    <select
                      id="room-gender"
                      value={genderPreference}
                      onChange={(e) =>
                        setGenderPreference(e.target.value as "male" | "female" | "any")
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="any">Any / Co-ed</option>
                      <option value="female">Female Only</option>
                      <option value="male">Male Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="room-features">Room Features (comma-separated)</Label>
                  <Input
                    id="room-features"
                    placeholder="Ensuite Bath, Aircon, Study Desk, Balcony"
                    value={roomFeatures}
                    onChange={(e) => setRoomFeatures(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRoomDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingRoom}>
                    {submittingRoom ? "Saving..." : "Add Room Unit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Boarding Houses</div>
              <div className="text-xl font-bold font-mono">{properties.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Available Rooms</div>
              <div className="text-xl font-bold font-mono text-primary">{availableRooms}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Occupied Units</div>
              <div className="text-xl font-bold font-mono">{occupiedRooms}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Room Inventory</div>
              <div className="text-xl font-bold font-mono">{totalRooms}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split-Screen Content (Cards List + Interactive PostGIS Map) */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Loading property directory...
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${showMapView ? "lg:grid-cols-12" : "grid-cols-1"} gap-6`}>
          {/* Properties List Column */}
          <div className={`${showMapView ? "lg:col-span-7" : "col-span-full"} space-y-4`}>
            {properties.length === 0 ? (
              <Card className="p-12 text-center bg-muted/30">
                <Building className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-base font-medium">No boarding houses found</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Register your first student housing property using the button above.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsHouseDialogOpen(true)}
                  className="gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Boarding House
                </Button>
              </Card>
            ) : (
              properties.map((property) => {
              const isSelected = selectedPropertyId === property.id;
              const isHovered = hoveredPropertyId === property.id;

              return (
                <Card
                  key={property.id}
                  className={`border transition-all cursor-pointer overflow-hidden ${
                    isSelected || isHovered
                      ? "border-primary/50 shadow-sm"
                      : "hover:border-primary/30"
                  }`}
                  onMouseEnter={() => setHoveredPropertyId(property.id)}
                  onMouseLeave={() => setHoveredPropertyId(null)}
                  onClick={() => setSelectedPropertyId(property.id)}
                >
                  <CardHeader className="p-4 border-b bg-muted/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-semibold">
                            {property.name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px]">
                            Verified
                          </Badge>
                        </div>
                        <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          {property.address}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-primary font-mono font-semibold">
                          ${property.rooms?.[0]?.monthly_rent || 280}/mo
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] px-2 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetHouseId(property.id);
                            setIsRoomDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" /> Unit
                        </Button>
                      </div>
                    </div>

                    {/* Amenities Badges */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        {property.amenities.map((amenity) => (
                          <Badge
                            key={amenity}
                            variant="outline"
                            className="text-[10px] bg-muted/50"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Room Inventory ({property.rooms?.length || 0})</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {property.rooms?.filter((r) => r.status === "available").length || 0} vacant
                      </span>
                    </div>

                    {/* Room Units Mini Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {!property.rooms || property.rooms.length === 0 ? (
                        <div className="col-span-full h-16 flex items-center justify-center border border-dashed rounded-lg text-xs text-muted-foreground">
                          No room units configured yet.
                        </div>
                      ) : (
                        property.rooms.map((room) => (
                          <div
                            key={room.id}
                            className="rounded-lg border bg-muted/30 p-2.5 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{room.room_number}</span>
                              <Badge
                                variant={
                                  room.status === "available"
                                    ? "default"
                                    : room.status === "occupied"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-[9px] capitalize"
                              >
                                {room.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Capacity: {room.capacity}</span>
                              <span className="text-foreground font-mono font-medium">
                                ${room.monthly_rent}/mo
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }))}
          </div>

          {/* Interactive Split-Screen PostGIS Map Column */}
          {showMapView && (
            <div className="lg:col-span-5 sticky top-6">
              <InteractiveMap
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                hoveredPropertyId={hoveredPropertyId}
                onSelectProperty={setSelectedPropertyId}
                onHoverProperty={setHoveredPropertyId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
