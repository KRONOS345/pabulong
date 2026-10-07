"use client";

import * as React from "react";
import { MessageSquare, Send, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { createInquiryAction } from "@/actions/marketplace";
import type { BoardingHouse, Room } from "@/lib/marketplace-types";

interface InquiryDialogProps {
  house: BoardingHouse;
  selectedRoomId?: string;
  triggerButton?: React.ReactNode;
}

export function InquiryDialog({
  house,
  selectedRoomId,
  triggerButton,
}: InquiryDialogProps) {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [roomId, setRoomId] = React.useState<string>(selectedRoomId || "any");
  const [targetMoveIn, setTargetMoveIn] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && selectedRoomId) {
      setRoomId(selectedRoomId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.info("Sign in required", {
        description: "Please sign in to send an inquiry to the boarding house landlord.",
      });
      return;
    }

    if (!message.trim()) {
      toast.error("Message required", {
        description: "Please enter a short message for the landlord.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createInquiryAction({
        boardingHouseId: house.id,
        roomId: roomId === "any" ? undefined : roomId,
        targetMoveIn: targetMoveIn || undefined,
        message: message.trim(),
      });

      if (!res.success) {
        toast.error("Inquiry failed", {
          description: res.error || "Unable to submit inquiry. Please try again.",
        });
      } else {
        setIsSubmitted(true);
        toast.success("Inquiry sent successfully!", {
          description: "The landlord has been notified of your interest.",
        });
        setTimeout(() => {
          setOpen(false);
          setIsSubmitted(false);
          setMessage("");
          setTargetMoveIn("");
        }, 1800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error("Error sending inquiry", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerButton ? (
        <DialogTrigger render={triggerButton as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              <MessageSquare className="h-4 w-4" />
              Inquire / Contact Landlord
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Send Inquiry to Landlord
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Contact the owner of <span className="font-semibold text-foreground">{house.name}</span> in Barangay {house.barangay}.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-foreground text-base">Inquiry Submitted!</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Your inquiry and initial message have been delivered to the property manager.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Room selection if rooms exist */}
            {house.rooms && house.rooms.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="room-select" className="text-xs font-medium">
                  Room of Interest
                </Label>
                <Select
                  value={roomId}
                  onValueChange={(val: string | null) => {
                    if (val) setRoomId(val);
                  }}
                >
                  <SelectTrigger id="room-select" className="h-10 text-sm">
                    <SelectValue placeholder="Select a specific room (optional)">
                      {(val) => {
                        if (!val || val === "any") return "Any Available Room";
                        const found = house.rooms?.find((r) => r.id === val);
                        if (found) {
                          const roomNum =
                            found.room_number.toLowerCase().startsWith("unit") ||
                            found.room_number.toLowerCase().startsWith("room")
                              ? found.room_number
                              : `Room ${found.room_number}`;
                          return `${roomNum} (${found.room_type}) — ₱${found.monthly_rent.toLocaleString()}/mo`;
                        }
                        return "Select a specific room (optional)";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Available Room</SelectItem>
                    {house.rooms.map((r: Room) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.room_number.toLowerCase().startsWith("unit") ||
                        r.room_number.toLowerCase().startsWith("room")
                          ? r.room_number
                          : `Room ${r.room_number}`}{" "}
                        ({r.room_type}) — ₱{r.monthly_rent.toLocaleString()}/mo ({r.available_beds} beds left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Move-in Date */}
            <div className="space-y-1.5">
              <Label htmlFor="target-date" className="text-xs font-medium">
                Target Move-In Date
              </Label>
              <div className="relative">
                <Input
                  id="target-date"
                  type="date"
                  value={targetMoveIn}
                  onChange={(e) => setTargetMoveIn(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="inquiry-message" className="text-xs font-medium">
                Message to Landlord *
              </Label>
              <Textarea
                id="inquiry-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello! I am a student looking for accommodation for the upcoming semester. Is this room still available for viewing?"
                rows={4}
                required
                className="text-sm resize-none"
              />
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-10 px-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
