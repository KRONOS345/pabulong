"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createRoomAction,
  updateRoomAction,
  updateRoomAvailabilityAction,
  deleteRoomAction,
} from "@/actions/marketplace";
import type { BoardingHouse, Room, RoomType } from "@/lib/marketplace-types";

const ROOM_FEATURE_OPTIONS = [
  "Private Bathroom",
  "Air Conditioning",
  "Ceiling Fan",
  "Study Desk & Chair",
  "Wardrobe / Cabinet",
  "Window / Natural Light",
  "Bunk Bed with Mattress",
  "Balcony View",
];

interface RoomManagerProps {
  property: BoardingHouse;
}

export function RoomManager({ property }: RoomManagerProps) {
  const router = useRouter();
  const [rooms, setRooms] = React.useState<Room[]>(property.rooms || []);
  const [loading, setLoading] = React.useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const [activeRoom, setActiveRoom] = React.useState<Room | null>(null);

  // Form states for Add / Edit
  const [roomNumber, setRoomNumber] = React.useState("");
  const [roomType, setRoomType] = React.useState<RoomType>("solo");
  const [capacity, setCapacity] = React.useState(1);
  const [availableBeds, setAvailableBeds] = React.useState(1);
  const [monthlyRent, setMonthlyRent] = React.useState<number | "">("");
  const [securityDeposit, setSecurityDeposit] = React.useState<number | "">("");
  const [floorLevel, setFloorLevel] = React.useState(1);
  const [genderPreference, setGenderPreference] = React.useState<"male" | "female" | "any">("any");
  const [features, setFeatures] = React.useState<string[]>([]);

  const resetForm = () => {
    setRoomNumber("");
    setRoomType("solo");
    setCapacity(1);
    setAvailableBeds(1);
    setMonthlyRent("");
    setSecurityDeposit("");
    setFloorLevel(1);
    setGenderPreference("any");
    setFeatures([]);
    setActiveRoom(null);
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setActiveRoom(room);
    setRoomNumber(room.room_number);
    setRoomType(room.room_type);
    setCapacity(room.capacity);
    setAvailableBeds(room.available_beds !== undefined ? room.available_beds : room.capacity);
    setMonthlyRent(room.monthly_rent);
    setSecurityDeposit(room.security_deposit || 0);
    setFloorLevel(room.floor_level || 1);
    setGenderPreference(room.gender_preference || "any");
    setFeatures(room.features || []);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (room: Room) => {
    setActiveRoom(room);
    setDeleteDialogOpen(true);
  };

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  // Toggle availability switch
  const handleToggleAvailability = async (room: Room, isAvailable: boolean) => {
    try {
      // Optimistic update
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? {
                ...r,
                is_available: isAvailable,
                status: isAvailable ? "available" : "occupied",
                available_beds: isAvailable ? (r.available_beds > 0 ? r.available_beds : r.capacity) : 0,
              }
            : r
        )
      );

      const targetBeds = isAvailable
        ? room.available_beds > 0
          ? room.available_beds
          : room.capacity
        : 0;

      const res = await updateRoomAvailabilityAction(
        room.id,
        isAvailable,
        targetBeds,
        property.id
      );

      if (!res.success) {
        toast.error(res.error || "Failed to update availability");
        router.refresh();
      } else {
        toast.success(
          `Room ${room.room_number} marked as ${isAvailable ? "Available" : "Occupied"}`
        );
      }
    } catch {
      toast.error("Failed to update room availability");
      router.refresh();
    }
  };

  // Stepper for available beds
  const handleBedsChange = async (room: Room, delta: number) => {
    const current = room.available_beds !== undefined ? room.available_beds : room.capacity;
    const nextBeds = Math.max(0, Math.min(room.capacity, current + delta));
    const nextAvailable = nextBeds > 0;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              available_beds: nextBeds,
              is_available: nextAvailable,
              status: nextAvailable ? "available" : "occupied",
            }
          : r
      )
    );

    try {
      const res = await updateRoomAvailabilityAction(
        room.id,
        nextAvailable,
        nextBeds,
        property.id
      );
      if (!res.success) {
        toast.error(res.error || "Failed to update beds");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update bed vacancy");
      router.refresh();
    }
  };

  // Handle Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      toast.error("Please enter a room number or unit label");
      return;
    }
    const rent = typeof monthlyRent === "number" ? monthlyRent : parseFloat(String(monthlyRent));
    if (isNaN(rent) || rent <= 0) {
      toast.error("Monthly rent must be greater than ₱0");
      return;
    }
    if (capacity < 1) {
      toast.error("Capacity must be at least 1 person");
      return;
    }

    setLoading(true);
    try {
      const res = await createRoomAction(property.id, {
        room_number: roomNumber.trim(),
        room_type: roomType,
        capacity,
        available_beds: availableBeds,
        monthly_rent: rent,
        security_deposit: typeof securityDeposit === "number" ? securityDeposit : 0,
        floor_level: floorLevel,
        gender_preference: genderPreference,
        features,
      });

      if (!res.success || !res.room) {
        toast.error(res.error || "Failed to add room unit");
        setLoading(false);
        return;
      }

      toast.success(`Room ${roomNumber} added successfully!`);
      setRooms((prev) => [...prev, res.room!]);
      setAddDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create room";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Room
  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;

    if (!roomNumber.trim()) {
      toast.error("Please enter a room number");
      return;
    }
    const rent = typeof monthlyRent === "number" ? monthlyRent : parseFloat(String(monthlyRent));
    if (isNaN(rent) || rent <= 0) {
      toast.error("Monthly rent must be greater than ₱0");
      return;
    }

    setLoading(true);
    try {
      const res = await updateRoomAction(
        activeRoom.id,
        {
          room_number: roomNumber.trim(),
          room_type: roomType,
          capacity,
          available_beds: availableBeds,
          monthly_rent: rent,
          security_deposit: typeof securityDeposit === "number" ? securityDeposit : 0,
          floor_level: floorLevel,
          gender_preference: genderPreference,
          features,
        },
        property.id
      );

      if (!res.success) {
        toast.error(res.error || "Failed to update room unit");
        setLoading(false);
        return;
      }

      toast.success(`Room ${roomNumber} updated successfully!`);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoom.id
            ? {
                ...r,
                room_number: roomNumber.trim(),
                room_type: roomType,
                capacity,
                available_beds: availableBeds,
                monthly_rent: rent,
                security_deposit: typeof securityDeposit === "number" ? securityDeposit : 0,
                floor_level: floorLevel,
                gender_preference: genderPreference,
                features,
              }
            : r
        )
      );
      setEditDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update room";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Room
  const handleDeleteRoom = async () => {
    if (!activeRoom) return;
    setLoading(true);
    try {
      const res = await deleteRoomAction(activeRoom.id, property.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete room unit");
        setLoading(false);
        return;
      }

      toast.success(`Room ${activeRoom.room_number} deleted`);
      setRooms((prev) => prev.filter((r) => r.id !== activeRoom.id));
      setDeleteDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete room";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bed className="h-6 w-6 text-emerald-500" />
            Room & Vacancy Inventory
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Set rates in Philippine Pesos (₱), manage capacities, and update live vacancies.
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Room Unit
        </Button>
      </div>

      {/* Room Table / Grid */}
      {rooms.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-card/40 text-center py-12 px-4">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Bed className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">
              No rooms added yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add individual rooms, shared bedspaces, or studio pads to let seekers compare pricing and inquire.
            </p>
            <div className="pt-2">
              <Button
                onClick={openAddDialog}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="h-4 w-4" />
                Add First Room
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const isAvailable = room.is_available;
            const currentBeds =
              room.available_beds !== undefined ? room.available_beds : room.capacity;

            return (
              <Card
                key={room.id}
                className={`border transition-all bg-card/60 ${
                  isAvailable ? "border-border/60 hover:border-border" : "border-zinc-800/80 bg-zinc-950/40 opacity-80"
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">
                        Room {room.room_number}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-normal">
                        {room.room_type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`avail-${room.id}`} className="text-[11px] text-muted-foreground cursor-pointer">
                        {isAvailable ? "Available" : "Occupied"}
                      </Label>
                      <Switch
                        id={`avail-${room.id}`}
                        checked={isAvailable}
                        onCheckedChange={(checked) =>
                          handleToggleAvailability(room, checked)
                        }
                      />
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Floor {room.floor_level || 1} • Max {room.capacity} {room.capacity === 1 ? "person" : "pax"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Rent Rate Display */}
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Monthly Rent
                      </div>
                      <div className="text-lg font-extrabold text-foreground">
                        ₱{room.monthly_rent.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground"> /mo</span>
                      </div>
                    </div>

                    {room.security_deposit ? (
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Deposit
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          ₱{room.security_deposit.toLocaleString()}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Bed Vacancy Stepper */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-background border text-xs">
                    <span className="text-muted-foreground">Vacant Beds:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 text-xs"
                        disabled={currentBeds <= 0}
                        onClick={() => handleBedsChange(room, -1)}
                      >
                        -
                      </Button>
                      <span className="font-bold text-foreground min-w-[36px] text-center">
                        {currentBeds} / {room.capacity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 text-xs"
                        disabled={currentBeds >= room.capacity}
                        onClick={() => handleBedsChange(room, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Features Pills */}
                  {room.features && room.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.features.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                      {room.features.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{room.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => openEditDialog(room)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => openDeleteDialog(room)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Room Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Bed className="h-5 w-5 text-emerald-500" />
                Add Room Unit
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register a room or bedspace under {property.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-roomNumber" className="text-xs font-semibold">
                    Room # / Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="add-roomNumber"
                    required
                    placeholder="e.g. 101, Room A"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-roomType" className="text-xs font-semibold">
                    Room Type
                  </Label>
                  <Select
                    value={roomType}
                    onValueChange={(val) => {
                      const t = val as RoomType;
                      setRoomType(t);
                      if (t === "solo") {
                        setCapacity(1);
                        setAvailableBeds(1);
                      }
                    }}
                  >
                    <SelectTrigger id="add-roomType">
                      <SelectValue placeholder="Room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Room (1 Pax)</SelectItem>
                      <SelectItem value="shared">Shared Room (2-4 Pax)</SelectItem>
                      <SelectItem value="bedspace">Bedspace (Shared Dorm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-capacity" className="text-xs font-semibold">
                    Total Capacity (Pax) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="add-capacity"
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={capacity}
                    onChange={(e) => {
                      const c = parseInt(e.target.value) || 1;
                      setCapacity(c);
                      if (availableBeds > c) setAvailableBeds(c);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-availableBeds" className="text-xs font-semibold">
                    Initial Vacant Beds
                  </Label>
                  <Input
                    id="add-availableBeds"
                    type="number"
                    min="0"
                    max={capacity}
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-monthlyRent" className="text-xs font-semibold">
                    Monthly Rent (₱) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="add-monthlyRent"
                    type="number"
                    min="1"
                    step="50"
                    required
                    placeholder="2500"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-securityDeposit" className="text-xs font-semibold">
                    Security Deposit (₱)
                  </Label>
                  <Input
                    id="add-securityDeposit"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-floor" className="text-xs font-semibold">
                    Floor Level
                  </Label>
                  <Input
                    id="add-floor"
                    type="number"
                    min="1"
                    max="10"
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-gender" className="text-xs font-semibold">
                    Gender Preference
                  </Label>
                  <Select
                    value={genderPreference}
                    onValueChange={(val) => setGenderPreference(val as "male" | "female" | "any")}
                  >
                    <SelectTrigger id="add-gender">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any / Co-ed</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Room Features Pills */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold block">Room Inclusions</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ROOM_FEATURE_OPTIONS.map((feat) => {
                    const isChecked = features.includes(feat);
                    return (
                      <button
                        type="button"
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={`text-[11px] p-2 rounded border text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-medium"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{feat}</span>
                        {isChecked && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Room Unit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <form onSubmit={handleUpdateRoom} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Edit className="h-5 w-5 text-emerald-500" />
                Edit Room {activeRoom?.room_number}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update room rates, capacity, or inclusions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-roomNumber" className="text-xs font-semibold">
                    Room # / Name
                  </Label>
                  <Input
                    id="edit-roomNumber"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-roomType" className="text-xs font-semibold">
                    Room Type
                  </Label>
                  <Select
                    value={roomType}
                    onValueChange={(val) => setRoomType(val as RoomType)}
                  >
                    <SelectTrigger id="edit-roomType">
                      <SelectValue placeholder="Room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Room</SelectItem>
                      <SelectItem value="shared">Shared Room</SelectItem>
                      <SelectItem value="bedspace">Bedspace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-capacity" className="text-xs font-semibold">
                    Capacity (Pax)
                  </Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={capacity}
                    onChange={(e) => {
                      const c = parseInt(e.target.value) || 1;
                      setCapacity(c);
                      if (availableBeds > c) setAvailableBeds(c);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-availableBeds" className="text-xs font-semibold">
                    Vacant Beds
                  </Label>
                  <Input
                    id="edit-availableBeds"
                    type="number"
                    min="0"
                    max={capacity}
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-monthlyRent" className="text-xs font-semibold">
                    Monthly Rent (₱)
                  </Label>
                  <Input
                    id="edit-monthlyRent"
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-securityDeposit" className="text-xs font-semibold">
                    Security Deposit (₱)
                  </Label>
                  <Input
                    id="edit-securityDeposit"
                    type="number"
                    min="0"
                    step="50"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold block">Room Inclusions</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ROOM_FEATURE_OPTIONS.map((feat) => {
                    const isChecked = features.includes(feat);
                    return (
                      <button
                        type="button"
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={`text-[11px] p-2 rounded border text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-medium"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{feat}</span>
                        {isChecked && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Delete Room {activeRoom?.room_number}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove Room {activeRoom?.room_number}? This unit will no longer appear on your public listing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={handleDeleteRoom}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
