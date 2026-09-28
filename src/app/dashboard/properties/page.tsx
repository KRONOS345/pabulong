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
        if (data.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(data[0].id);
        }
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [selectedPropertyId]);

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Building className="h-5 w-5 text-indigo-400" />
            </div>
            Properties & Geolocation Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            PostGIS spatial mapping, room capacity monitoring, and student housing directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Map View Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMapView(!showMapView)}
            className="gap-2 border-slate-800 bg-slate-900/80 text-xs text-indigo-300 hover:text-white"
          >
            <MapIcon className="h-3.5 w-3.5 text-indigo-400" />
            {showMapView ? "Hide Split Map" : "Show Split Map"}
          </Button>

          {/* New House Dialog */}
          <Dialog open={isHouseDialogOpen} onOpenChange={setIsHouseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2 shadow-indigo-500/20 text-xs">
                <Plus className="h-4 w-4" />
                Add Boarding House
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Register Boarding House</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Creates a verified property listing enabled for PostGIS radius matching.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateHouse} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Property Name</label>
                  <Input
                    placeholder="e.g. Apex Student Residences Block C"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Address / Location</label>
                  <Input
                    placeholder="e.g. 74 University Ave, Near North Gate"
                    value={houseAddress}
                    onChange={(e) => setHouseAddress(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Description</label>
                  <Input
                    placeholder="Brief description of the facility"
                    value={houseDescription}
                    onChange={(e) => setHouseDescription(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Amenities (comma-separated)</label>
                  <Input
                    placeholder="Fiber Wi-Fi, CCTV, Backup Generator"
                    value={houseAmenities}
                    onChange={(e) => setHouseAmenities(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">House Rules (comma-separated)</label>
                  <Input
                    placeholder="10PM Curfew, No Smoking, Visitor Logs"
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Contact Email</label>
                    <Input
                      type="email"
                      placeholder="desk@residence.edu"
                      value={houseEmail}
                      onChange={(e) => setHouseEmail(e.target.value)}
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Contact Phone</label>
                    <Input
                      placeholder="+1 (555) 019-9922"
                      value={housePhone}
                      onChange={(e) => setHousePhone(e.target.value)}
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHouseDialogOpen(false)}
                    className="border-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" disabled={submittingHouse}>
                    {submittingHouse ? "Saving..." : "Save Property"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* New Room Dialog */}
          <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs"
                onClick={() => {
                  if (properties.length > 0 && !targetHouseId) {
                    setTargetHouseId(properties[0].id);
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Create Room Unit</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Adds an inventory room slot linked to a verified boarding house.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateRoom} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Boarding House</label>
                  <select
                    value={targetHouseId}
                    onChange={(e) => setTargetHouseId(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Unit / Room #</label>
                    <Input
                      placeholder="e.g. Unit 302"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Max Capacity</label>
                    <Input
                      type="number"
                      min="1"
                      max="8"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Rent ($/month)</label>
                    <Input
                      type="number"
                      min="50"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Gender Policy</label>
                    <select
                      value={genderPreference}
                      onChange={(e) =>
                        setGenderPreference(e.target.value as "male" | "female" | "any")
                      }
                      className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="any">Any / Co-ed</option>
                      <option value="female">Female Only</option>
                      <option value="male">Male Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Room Features (comma-separated)</label>
                  <Input
                    placeholder="Ensuite Bath, Aircon, Study Desk, Balcony"
                    value={roomFeatures}
                    onChange={(e) => setRoomFeatures(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRoomDialogOpen(false)}
                    className="border-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" disabled={submittingRoom}>
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
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Building className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Boarding Houses</div>
              <div className="text-xl font-bold font-mono text-white">{properties.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Available Rooms</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{availableRooms}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Occupied Units</div>
              <div className="text-xl font-bold font-mono text-blue-400">{occupiedRooms}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Bed className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Room Inventory</div>
              <div className="text-xl font-bold font-mono text-purple-300">{totalRooms}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split-Screen Content (Cards List + Interactive PostGIS Map) */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          Loading property directory...
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${showMapView ? "lg:grid-cols-12" : "grid-cols-1"} gap-6`}>
          {/* Properties List Column */}
          <div className={`${showMapView ? "lg:col-span-7" : "col-span-full"} space-y-4`}>
            {properties.map((property) => {
              const isSelected = selectedPropertyId === property.id;
              const isHovered = hoveredPropertyId === property.id;

              return (
                <Card
                  key={property.id}
                  className={`border transition-all cursor-pointer backdrop-blur-md overflow-hidden ${
                    isSelected || isHovered
                      ? "border-indigo-500/70 bg-slate-900/70 shadow-lg shadow-indigo-500/10"
                      : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700"
                  }`}
                  onMouseEnter={() => setHoveredPropertyId(property.id)}
                  onMouseLeave={() => setHoveredPropertyId(null)}
                  onClick={() => setSelectedPropertyId(property.id)}
                >
                  <CardHeader className="p-4 border-b border-slate-800/60 bg-slate-950/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base text-white font-semibold">
                            {property.name}
                          </CardTitle>
                          <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[10px]">
                            Verified
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          {property.address}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-400 font-mono font-semibold">
                          ${property.rooms?.[0]?.monthly_rent || 280}/mo
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-indigo-300 hover:text-white px-2 gap-1"
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
                            variant="secondary"
                            className="text-[10px] bg-slate-800/70 text-slate-300 border border-slate-700/50"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Room Inventory ({property.rooms?.length || 0})</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {property.rooms?.filter((r) => r.status === "available").length || 0} vacant
                      </span>
                    </div>

                    {/* Room Units Mini Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {!property.rooms || property.rooms.length === 0 ? (
                        <div className="col-span-full h-16 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                          No room units configured yet.
                        </div>
                      ) : (
                        property.rooms.map((room) => (
                          <div
                            key={room.id}
                            className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{room.room_number}</span>
                              <Badge
                                variant={
                                  room.status === "available"
                                    ? "success"
                                    : room.status === "occupied"
                                    ? "secondary"
                                    : "warning"
                                }
                                className="text-[9px] capitalize"
                              >
                                {room.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Capacity: {room.capacity}</span>
                              <span className="text-emerald-400 font-mono font-medium">
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
            })}
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
