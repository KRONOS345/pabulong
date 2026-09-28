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
  badgeVariant: "default" | "secondary" | "outline" | "success" | "warning" | "info";
}[] = [
  { stage: "Inquiry", label: "Inquiry", badgeVariant: "default" },
  { stage: "Viewing", label: "Viewing", badgeVariant: "warning" },
  { stage: "Deposit Pending", label: "Deposit Pending", badgeVariant: "info" },
  { stage: "Placed", label: "Placed", badgeVariant: "success" },
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
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>{escrowSuccessMsg}</span>
          </div>
          <button
            onClick={() => setEscrowSuccessMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Kanban className="h-5 w-5 text-purple-400" />
            </div>
            Placement Control Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pipeline orchestration matching prospective student tenants to verified dorm rooms.
          </p>
        </div>

        {/* New Placement Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="gap-2 shadow-indigo-500/20">
              <Plus className="h-4 w-4" />
              New Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Record Client Inquiry</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Creates a new tenant candidate in the Inquiry pipeline stage.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInquiry} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Client Name</label>
                <Input
                  placeholder="e.g. Jordan Hayes"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <Input
                    type="email"
                    placeholder="jordan@student.edu"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Phone</label>
                  <Input
                    placeholder="+1 555-0100"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Max Budget ($/mo)</label>
                  <Input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Preferred Area</label>
                  <Input
                    placeholder="e.g. Near Science Quad"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Notes / Requirements</label>
                <textarea
                  placeholder="e.g. Prefers quiet study floor, non-smoker, move-in before Sept 1."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewDialogOpen(false)}
                  className="border-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={submitting}>
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
              className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 min-h-[550px] backdrop-blur-md"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 px-1">
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant} className="text-xs font-semibold px-2 py-0.5">
                    {label}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    ({stagePlacements.length})
                  </span>
                </div>
              </div>

              {/* Placement Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {stagePlacements.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/60 rounded-lg text-xs text-slate-600">
                    No candidates in {label}
                  </div>
                ) : (
                  stagePlacements.map((item) => (
                    <Card
                      key={item.id}
                      className="border-slate-800/90 bg-slate-900/60 hover:border-slate-700 transition-all p-3.5 space-y-3"
                    >
                      {/* Tenant Title & Budget */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-white">
                            {item.client_name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-500" />
                            {item.client_email}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] shrink-0 font-mono"
                        >
                          ${item.budget_max}/mo
                        </Badge>
                      </div>

                      {/* Location & Details */}
                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{item.preferred_location}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic pt-1 border-t border-slate-800/60">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Room Matching Status */}
                      <div className="pt-2 border-t border-slate-800/80">
                        {item.matched_room ? (
                          <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-indigo-300 flex items-center gap-1">
                                <Building className="h-3 w-3 text-indigo-400" />
                                {item.matched_room.boardingHouseName}
                              </span>
                              <span className="text-emerald-400 font-mono">
                                ${item.matched_room.monthlyRent}/mo
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>{item.matched_room.roomNumber}</span>
                              <button
                                onClick={() => {
                                  setActivePlacementForMatch(item);
                                  setIsMatchDialogOpen(true);
                                }}
                                className="text-indigo-400 hover:underline"
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
                            className="w-full text-xs h-7 border-dashed border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                          >
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            Match to Room
                          </Button>
                        )}
                      </div>

                      {/* Stripe Deposit Escrow CTA for Deposit Pending */}
                      {item.stage === "Deposit Pending" && (
                        <div className="pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInitiateEscrow(item)}
                            className="w-full h-7 text-[11px] border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 gap-1.5"
                          >
                            <CreditCard className="h-3 w-3 text-emerald-400" />
                            Stripe Escrow Deposit (${item.matched_room?.monthlyRent || item.budget_max})
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
                            className="h-6 text-[10px] px-2 text-slate-400 hover:text-white"
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
                            className="h-6 text-[10px] px-2 text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30"
                          >
                            {STAGES[stageIndex + 1].label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <Badge
                            variant="success"
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
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Match Room to {activePlacementForMatch?.client_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Client budget:{" "}
              <span className="text-emerald-400 font-semibold font-mono">
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
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between hover:border-indigo-500/50 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {room.boardingHouseName}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-slate-700">
                        {room.roomNumber}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Capacity: {room.capacity}</span>
                      <span>•</span>
                      <span>Gender: {room.genderPreference}</span>
                      <span>•</span>
                      <div className="flex gap-1">
                        {room.features.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-base font-bold font-mono text-emerald-400">
                      ${room.monthlyRent}
                      <span className="text-xs text-slate-500 font-normal">/mo</span>
                    </div>

                    <Button
                      size="sm"
                      variant={isWithinBudget ? "gradient" : "outline"}
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
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Room Security Deposit Escrow
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Funds are held in a secure Stripe escrow holding account until lease signing.
            </DialogDescription>
          </DialogHeader>

          {escrowPlacement && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenant Candidate:</span>
                  <span className="font-semibold text-white">{escrowPlacement.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Room:</span>
                  <span className="text-indigo-300 font-medium">
                    {escrowPlacement.matched_room?.roomNumber || "Unit Assigned"} -{" "}
                    {escrowPlacement.matched_room?.boardingHouseName || "Boarding House"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2 font-mono">
                  <span className="text-slate-300 font-sans">Escrow Security Deposit:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    ${escrowPlacement.matched_room?.monthlyRent || escrowPlacement.budget_max}.00 USD
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-lg">
                <p className="font-semibold text-indigo-300 flex items-center gap-1">
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
                  className="border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
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
