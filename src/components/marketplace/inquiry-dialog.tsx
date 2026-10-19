"use client";

import * as React from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  User,
  Calendar,
  Info,
  AlertCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useUser } from "@clerk/nextjs";
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
  const { user } = useUser();

  const [open, setOpen] = React.useState(false);
  const [roomId, setRoomId] = React.useState<string>(selectedRoomId || "any");
  const [targetMoveIn, setTargetMoveIn] = React.useState<string>("");
  const [stayDuration, setStayDuration] = React.useState<string>("1_academic_year");
  const [occupantCount, setOccupantCount] = React.useState<string>("1");
  const [fullName, setFullName] = React.useState<string>(user?.fullName || "");
  const [contactPhone, setContactPhone] = React.useState<string>("");
  const [contactEmail, setContactEmail] = React.useState<string>(
    user?.primaryEmailAddress?.emailAddress || ""
  );
  const [seekerNotes, setSeekerNotes] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("");
  const [consentGiven, setConsentGiven] = React.useState<boolean>(false);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setFormError(null);
    if (nextOpen) {
      if (selectedRoomId) {
        setRoomId(selectedRoomId);
      }
      if (!fullName && user?.fullName) {
        setFullName(user.fullName);
      }
      if (!contactEmail && user?.primaryEmailAddress?.emailAddress) {
        setContactEmail(user.primaryEmailAddress.emailAddress);
      }
    }
  };

  const validateForm = (): boolean => {
    if (!isSignedIn) {
      setFormError("Please sign in to send an inquiry to the boarding house landlord.");
      return false;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError("Full name is required (minimum 2 characters).");
      return false;
    }

    if (!contactPhone.trim() || !/^[+0-9\s\-()]{7,25}$/.test(contactPhone.trim())) {
      setFormError("A valid contact phone number is required (at least 7 digits).");
      return false;
    }

    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setFormError("A valid email address is required.");
      return false;
    }

    if (!stayDuration) {
      setFormError("Please select your expected length of stay.");
      return false;
    }

    if (!message.trim()) {
      setFormError("Please enter a short message for the landlord.");
      return false;
    }

    if (!consentGiven) {
      setFormError(
        "Please provide your consent to share this rental verification information with the property owner."
      );
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const durationMap: Record<string, string> = {
      "1_semester": "1 Semester (~5 Months)",
      "1_academic_year": "1 Academic Year (~10-12 Months)",
      "short_term": "Short-term (1 - 3 Months)",
      "long_term": "Long-term (1+ Years)",
    };

    try {
      const res = await createInquiryAction({
        boardingHouseId: house.id,
        roomId: roomId === "any" ? undefined : roomId,
        targetMoveIn: targetMoveIn || undefined,
        fullName: fullName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        stayDuration: durationMap[stayDuration] || stayDuration,
        occupantCount: parseInt(occupantCount, 10) || 1,
        seekerNotes: seekerNotes.trim() || undefined,
        consentGiven: true,
        message: message.trim(),
      });

      if (!res.success) {
        setFormError(res.error || "Unable to submit inquiry. Please try again.");
        toast.error("Inquiry submission failed", {
          description: res.error || "Please verify your information and try again.",
        });
      } else {
        setIsSubmitted(true);
        toast.success("Inquiry sent successfully!", {
          description: "Your rental verification and message were sent to the landlord.",
        });
        setTimeout(() => {
          setOpen(false);
          setIsSubmitted(false);
          setMessage("");
          setTargetMoveIn("");
          setConsentGiven(false);
        }, 2200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setFormError(msg);
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
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                Rental Inquiry & Verification Information
              </DialogTitle>
              <h3 className="sr-only">Send Inquiry to Landlord</h3>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Connecting with <span className="font-semibold text-foreground">{house.name}</span> in Barangay {house.barangay}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-foreground text-lg">Inquiry & Details Submitted</h4>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Your rental verification details and initial message have been securely delivered to the property owner. You can track replies in your conversation dashboard.
            </p>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs mt-2">
              ✓ Owner Notification Dispatched
            </Badge>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* Privacy Transparency Notice */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Verification Purpose & Privacy Notice</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This verification information helps the landlord evaluate tenancy fit, check room vacancy, and schedule viewings. We do not perform criminal or credit checks, and your information is never shared publicly.
              </p>
            </div>

            {/* Validation Error Alert */}
            {formError && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2.5 text-xs text-destructive animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold">Inquiry Incomplete</span>
                  <p className="text-[11px] text-destructive/90">{formError}</p>
                </div>
              </div>
            )}

            {/* Section 1: Rental Scope */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>1. Rental Preferences</span>
              </div>

              {/* Room selection if rooms exist */}
              {house.rooms && house.rooms.length > 0 && (
                <div className="space-y-1">
                  <Label htmlFor="room-select" className="text-xs font-medium">
                    Room of Interest
                  </Label>
                  <Select
                    value={roomId}
                    onValueChange={(val: string | null) => {
                      if (val) setRoomId(val);
                    }}
                  >
                    <SelectTrigger id="room-select" className="h-9 text-xs">
                      <SelectValue placeholder="Select a specific room (optional)">
                        {(val) => {
                          if (!val || val === "any") return "Any Available Room in House";
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
                      <SelectItem value="any">Any Available Room in House</SelectItem>
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
                  <p className="text-[10px] text-muted-foreground">
                    Required to determine which specific room layout and rate you are requesting.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Move-in Date */}
                <div className="space-y-1">
                  <Label htmlFor="target-date" className="text-xs font-medium">
                    Target Move-In Date
                  </Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={targetMoveIn}
                    onChange={(e) => setTargetMoveIn(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Helps the owner verify room readiness and align lease commencement.
                  </p>
                </div>

                {/* Length of Stay */}
                <div className="space-y-1">
                  <Label htmlFor="stay-duration" className="text-xs font-medium">
                    Expected Length of Stay *
                  </Label>
                  <Select
                    value={stayDuration}
                    onValueChange={(val: string | null) => {
                      if (val) setStayDuration(val);
                    }}
                  >
                    <SelectTrigger id="stay-duration" className="h-9 text-xs">
                      <SelectValue placeholder="Select stay duration">
                        {(val) => {
                          const map: Record<string, string> = {
                            "1_semester": "1 Semester (~5 Mos)",
                            "1_academic_year": "1 Academic Year (~10-12 Mos)",
                            short_term: "Short-term (1-3 Mos)",
                            long_term: "Long-term (1+ Years)",
                          };
                          return map[val as string] || "Select stay duration";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_semester">1 Semester (~5 Months)</SelectItem>
                      <SelectItem value="1_academic_year">1 Academic Year (~10-12 Months)</SelectItem>
                      <SelectItem value="short_term">Short-term (1 - 3 Months)</SelectItem>
                      <SelectItem value="long_term">Long-term (1+ Years)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Required to confirm seasonal or yearly contract commitments.
                  </p>
                </div>
              </div>

              {/* Number of Occupants */}
              <div className="space-y-1">
                <Label htmlFor="occupant-count" className="text-xs font-medium">
                  Number of Occupants *
                </Label>
                <Select
                  value={occupantCount}
                  onValueChange={(val: string | null) => {
                    if (val) setOccupantCount(val);
                  }}
                >
                  <SelectTrigger id="occupant-count" className="h-9 text-xs">
                    <SelectValue placeholder="Number of occupants">
                      {(val) => {
                        const count = val as string;
                        return count === "1" ? "1 Occupant (Solo)" : `${count} Occupants`;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Occupant (Solo)</SelectItem>
                    <SelectItem value="2">2 Occupants (Double)</SelectItem>
                    <SelectItem value="3">3 Occupants (Triple)</SelectItem>
                    <SelectItem value="4">4 Occupants (Group)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Ensures compliance with local boarding house capacity and room headcounts.
                </p>
              </div>
            </div>

            {/* Section 2: Seeker Contact & Verification */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>2. Applicant Information</span>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="applicant-name" className="text-xs font-medium">
                  Full Name *
                </Label>
                <Input
                  id="applicant-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  required
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Used by the property owner to formally address you and record your inquiry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div className="space-y-1">
                  <Label htmlFor="applicant-phone" className="text-xs font-medium">
                    Contact Phone Number *
                  </Label>
                  <Input
                    id="applicant-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    required
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Needed by the owner to coordinate on-site viewing and gate entry.
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="applicant-email" className="text-xs font-medium">
                    Contact Email Address *
                  </Label>
                  <Input
                    id="applicant-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="student@fsuu.edu.ph"
                    required
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    For sending lease guidelines, payment receipts, and contract notes.
                  </p>
                </div>
              </div>

              {/* Optional Renter Profile / Notes */}
              <div className="space-y-1">
                <Label htmlFor="applicant-notes" className="text-xs font-medium">
                  Renter Profile & Background (Optional)
                </Label>
                <Input
                  id="applicant-notes"
                  type="text"
                  value={seekerNotes}
                  onChange={(e) => setSeekerNotes(e.target.value)}
                  placeholder="e.g. 2nd-year Nursing student at FSUU, quiet habits, no car"
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Optional notes such as university affiliation or occupation help the landlord prepare a matching accommodation.
                </p>
              </div>
            </div>

            {/* Section 3: Message to Landlord */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label htmlFor="inquiry-message" className="text-xs font-medium">
                Message to Landlord *
              </Label>
              <Textarea
                id="inquiry-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello! I am looking for accommodation for the upcoming semester. May I request a schedule to visit and inspect the room?"
                rows={3}
                required
                className="text-xs resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                State your inquiries regarding curfew, visitor policy, or preferred viewing schedule.
              </p>
            </div>

            {/* Section 4: Consent & Authorization Checkbox */}
            <div className="pt-2 border-t border-border/60">
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <Checkbox
                  id="inquiry-consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(Boolean(checked))}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="inquiry-consent"
                    className="text-xs font-semibold text-foreground cursor-pointer leading-snug block"
                  >
                    Authorization & Consent to Share Information *
                  </label>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    I authorize Pabulong to share this rental inquiry and verification information directly with the verified owner of{" "}
                    <span className="font-semibold text-foreground">{house.name}</span> for the purpose of assessing my inquiry and coordinating rental arrangements. No public or third-party sharing.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 px-4 rounded-lg shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Verification...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Inquiry & Details
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
