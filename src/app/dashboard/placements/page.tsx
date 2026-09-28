"use client";

import * as React from "react";
import {
  Kanban,
  Building,
  MapPin,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mail,
  Check,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  fetchPlacements,
  updatePlacementStage,
  matchPlacementRoom,
  createPlacementAction,
} from "@/actions/placements";
import {
  AVAILABLE_ROOMS,
  type PlacementItem,
  type PlacementStage,
  type RoomOption,
} from "@/lib/placement-types";
import {
  createDepositCheckoutSession,
  verifyAndSettleDeposit,
} from "@/actions/stripe";

const STAGES: {
  stage: PlacementStage;
  label: string;
  badgeVariant: "default" | "secondary" | "outline";
}[] = [
  { stage: "Inquiry", label: "Inquiry", badgeVariant: "default" },
  { stage: "Viewing", label: "Viewing", badgeVariant: "secondary" },
  { stage: "Deposit Pending", label: "Deposit Pending", badgeVariant: "outline" },
  { stage: "Placed", label: "Placed", badgeVariant: "default" },
];

export default function PlacementsPage() {
  const [placements, setPlacements] = React.useState<PlacementItem[]>([]);
  const [activePlacementForMatch, setActivePlacementForMatch] = React.useState<PlacementItem | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = React.useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);

  // Escrow Dialog State
  const [escrowPlacement, setEscrowPlacement] = React.useState<PlacementItem | null>(null);
  const [isEscrowDialogOpen, setIsEscrowDialogOpen] = React.useState(false);
  const [escrowLoading, setEscrowLoading] = React.useState(false);
  const [escrowSuccessMsg, setEscrowSuccessMsg] = React.useState<string | null>(null);

  // New Inquiry Form State
  const [clientName, setClientName] = React.useState("");
  const [clientEmail, setClientEmail] = React.useState("");
  const [clientPhone, setClientPhone] = React.useState("");
  const [budgetMax, setBudgetMax] = React.useState("400");
  const [preferredLocation, setPreferredLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchPlacements().then((data) => {
      setPlacements(data);
    });

    // Authoritatively verify deposit status if returning from Stripe checkout
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deposit_confirmed") === "true") {
        const pId = params.get("placement_id");
        const sId = params.get("session_id") || undefined;
        if (pId) {
          verifyAndSettleDeposit({ placementId: pId, sessionId: sId }).then((res) => {
            if (res.success) {
              setEscrowSuccessMsg("Room security deposit verified via Stripe Escrow! Candidate transitioned to Placed.");
              setPlacements((prev) =>
                prev.map((p) => (p.id === pId ? { ...p, stage: "Placed" } : p))
              );
            }
          });
        }
      }
    }
  }, []);

  const handleStageChange = async (id: string, newStage: PlacementStage) => {
    setPlacements((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage: newStage } : p))
    );
    await updatePlacementStage(id, newStage);
  };

  const handleMatchRoom = async (room: RoomOption) => {
    if (!activePlacementForMatch) return;
    const pId = activePlacementForMatch.id;

    setPlacements((prev) =>
      prev.map((p) =>
        p.id === pId ? { ...p, room_id: room.id, matched_room: room } : p
      )
    );
    await matchPlacementRoom(pId, room.id);
    setIsMatchDialogOpen(false);
    setActivePlacementForMatch(null);
  };

  const handleInitiateEscrow = async (item: PlacementItem) => {
    setEscrowPlacement(item);
    setIsEscrowDialogOpen(true);
  };

  const handleExecuteEscrowCheckout = async () => {
    if (!escrowPlacement) return;
    setEscrowLoading(true);

    const roomName = escrowPlacement.matched_room?.roomNumber
      ? `${escrowPlacement.matched_room.boardingHouseName} (${escrowPlacement.matched_room.roomNumber})`
      : "Standard Student Unit";
    const monthlyRent = escrowPlacement.matched_room?.monthlyRent || escrowPlacement.budget_max;

    const res = await createDepositCheckoutSession({
      placementId: escrowPlacement.id,
      clientName: escrowPlacement.client_name,
      clientEmail: escrowPlacement.client_email,
      roomName,
      monthlyRent,
    });

    if (res.success && res.checkoutUrl) {
      if (res.isMock) {
        // Mock instant escrow confirmation
        await handleStageChange(escrowPlacement.id, "Placed");
        setEscrowSuccessMsg(
          `Deposit Secured: $${monthlyRent} escrow deposit confirmed in sandbox mode for ${escrowPlacement.client_name}!`
        );
        setIsEscrowDialogOpen(false);
      } else {
        // Redirect to real Stripe Checkout URL
        window.location.href = res.checkoutUrl;
      }
    }
    setEscrowLoading(false);
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;

    setSubmitting(true);
    const res = await createPlacementAction({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || undefined,
      budget_max: Number(budgetMax) || 350,
      preferred_location: preferredLocation || "Near Campus",
      notes: notes || undefined,
    });

    if (res.success && res.placement) {
      setPlacements((prev) => [res.placement!, ...prev]);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setBudgetMax("400");
      setPreferredLocation("");
      setNotes("");
      setIsNewDialogOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Escrow Success Banner */}
      {escrowSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>{escrowSuccessMsg}</span>
          </div>
          <button
            onClick={() => setEscrowSuccessMsg(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Kanban className="h-5 w-5 text-primary" />
            </div>
            Placement Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time pipeline orchestration matching prospective student tenants to verified dorm rooms.
          </p>
        </div>

        {/* New Placement Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger 
            render={
              <Button className="gap-2" />
            }
          >
            <Plus className="h-4 w-4" />
            New Inquiry
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Client Inquiry</DialogTitle>
              <DialogDescription>
                Creates a new tenant candidate in the Inquiry pipeline stage.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInquiry} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  placeholder="e.g. Jordan Hayes"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="client-email">Email Address</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="jordan@student.edu"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input
                    id="client-phone"
                    placeholder="+1 555-0100"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="budget-max">Max Budget ($/mo)</Label>
                  <Input
                    id="budget-max"
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred-location">Preferred Area</Label>
                  <Input
                    id="preferred-location"
                    placeholder="e.g. Near Science Quad"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes / Requirements</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Prefers quiet study floor, non-smoker, move-in before Sept 1."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Candidate"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map(({ stage, label, badgeVariant }) => {
          const stagePlacements = placements.filter((p) => p.stage === stage);
          const stageIndex = STAGES.findIndex((s) => s.stage === stage);

          return (
            <div
              key={stage}
              className="flex flex-col rounded-xl border bg-muted/30 p-3 min-h-[550px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b px-1">
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant} className="text-xs font-semibold px-2 py-0.5">
                    {label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono font-medium">
                    ({stagePlacements.length})
                  </span>
                </div>
              </div>

              {/* Placement Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {stagePlacements.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border border-dashed rounded-lg text-xs text-muted-foreground">
                    No candidates in {label}
                  </div>
                ) : (
                  stagePlacements.map((item) => (
                    <Card
                      key={item.id}
                      className="transition-all p-3.5 space-y-3"
                    >
                      {/* Tenant Title & Budget */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm">
                            {item.client_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {item.client_email}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0 font-mono"
                        >
                          ${item.budget_max}/mo
                        </Badge>
                      </div>

                      {/* Location & Details */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{item.preferred_location}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] line-clamp-2 italic pt-1 border-t">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Room Matching Status */}
                      <div className="pt-2 border-t">
                        {item.matched_room ? (
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-primary flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {item.matched_room.boardingHouseName}
                              </span>
                              <span className="text-primary font-mono font-medium">
                                ${item.matched_room.monthlyRent}/mo
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                              <span>{item.matched_room.roomNumber}</span>
                              <button
                                onClick={() => {
                                  setActivePlacementForMatch(item);
                                  setIsMatchDialogOpen(true);
                                }}
                                className="text-primary hover:underline"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActivePlacementForMatch(item);
                              setIsMatchDialogOpen(true);
                            }}
                            className="w-full text-xs h-7 border-dashed gap-1.5"
                          >
                            <Sparkles className="h-3 w-3 text-primary" />
                            Match to Room
                          </Button>
                        )}
                      </div>

                      {/* Stripe Deposit Escrow CTA for Deposit Pending */}
                      {item.stage === "Deposit Pending" && (
                        <div className="pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleInitiateEscrow(item)}
                            className="w-full h-7 text-[11px] gap-1.5"
                          >
                            <CreditCard className="h-3 w-3" />
                            Stripe Escrow (${item.matched_room?.monthlyRent || item.budget_max})
                          </Button>
                        </div>
                      )}

                      {/* Stage Shift Controls */}
                      <div className="flex items-center justify-between pt-1">
                        {stageIndex > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleStageChange(item.id, STAGES[stageIndex - 1].stage)
                            }
                            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="h-3 w-3 mr-1" />
                            {STAGES[stageIndex - 1].label}
                          </Button>
                        ) : (
                          <div />
                        )}

                        {stageIndex < STAGES.length - 1 ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleStageChange(item.id, STAGES[stageIndex + 1].stage)
                            }
                            className="h-6 text-[10px] px-2"
                          >
                            {STAGES[stageIndex + 1].label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <Badge
                            variant="default"
                            className="text-[10px] flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Settled
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Matching Modal */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Match Room to {activePlacementForMatch?.client_name}
            </DialogTitle>
            <DialogDescription>
              Client budget:{" "}
              <span className="font-semibold font-mono text-foreground">
                ${activePlacementForMatch?.budget_max}/month
              </span>{" "}
              • Preferred Area: {activePlacementForMatch?.preferred_location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-96 overflow-y-auto">
            {AVAILABLE_ROOMS.map((room) => {
              const isWithinBudget =
                (activePlacementForMatch?.budget_max || 0) >= room.monthlyRent;

              return (
                <div
                  key={room.id}
                  className="rounded-xl border p-4 flex items-center justify-between hover:border-primary/50 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {room.boardingHouseName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {room.roomNumber}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Capacity: {room.capacity}</span>
                      <span>•</span>
                      <span>Gender: {room.genderPreference}</span>
                      <span>•</span>
                      <div className="flex gap-1">
                        {room.features.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-base font-bold font-mono">
                      ${room.monthlyRent}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>

                    <Button
                      size="sm"
                      variant={isWithinBudget ? "default" : "outline"}
                      onClick={() => handleMatchRoom(room)}
                      className="text-xs h-7 gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Select Room
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stripe Escrow Deposit Modal */}
      <Dialog open={isEscrowDialogOpen} onOpenChange={setIsEscrowDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Room Security Deposit Escrow
            </DialogTitle>
            <DialogDescription>
              Funds are held in a secure Stripe escrow holding account until lease signing.
            </DialogDescription>
          </DialogHeader>

          {escrowPlacement && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant Candidate:</span>
                  <span className="font-semibold">{escrowPlacement.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Room:</span>
                  <span className="text-primary font-medium">
                    {escrowPlacement.matched_room?.roomNumber || "Unit Assigned"} -{" "}
                    {escrowPlacement.matched_room?.boardingHouseName || "Boarding House"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-mono">
                  <span className="font-sans text-muted-foreground">Escrow Security Deposit:</span>
                  <span className="font-bold text-sm text-foreground">
                    ${escrowPlacement.matched_room?.monthlyRent || escrowPlacement.budget_max}.00 USD
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1 bg-primary/5 border p-3 rounded-lg">
                <p className="font-semibold text-primary flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Stripe Payment Flow:
                </p>
                <p>
                  In live mode, the student receives a Stripe Checkout link. In development, click below to simulate instant deposit verification and transition candidate to <strong>Placed</strong>.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEscrowDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={escrowLoading}
                  onClick={handleExecuteEscrowCheckout}
                  className="gap-2"
                >
                  {escrowLoading ? "Processing..." : "Confirm & Settle Deposit"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
