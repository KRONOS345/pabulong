"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { createPropertyAction, updatePropertyAction } from "@/actions/marketplace";
import type { BoardingHouse, GenderRestriction } from "@/lib/marketplace-types";

const BUTUAN_BARANGAYS = [
  "Libertad",
  "Ampayon",
  "Villa Kananga",
  "Doongan",
  "San Vicente",
  "Baan Riverside",
  "Baan Km 3",
  "Holy Redeemer",
  "Bancasi",
  "Golden Ribbon",
  "Dagohoy",
  "Ong Yiu",
  "Pangabugan",
  "Tungao",
];

const COMMON_AMENITIES = [
  "High-Speed Wi-Fi",
  "Air Conditioning",
  "Study Lounge",
  "CCTV Security 24/7",
  "Kitchen Access",
  "Laundry Area",
  "Water Included",
  "Sub-metered Electricity",
  "Generator Backup",
  "Gated Perimeter",
];

const COMMON_RULES = [
  "No Smoking inside rooms",
  "Quiet Hours after 10:00 PM",
  "No Pets Allowed",
  "Visitors strictly in common areas",
  "Keep common areas clean",
  "Lock front gate after curfew",
];

interface PropertyFormProps {
  initialData?: BoardingHouse;
  isEdit?: boolean;
}

export function PropertyForm({ initialData, isEdit = false }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // Form states
  const [name, setName] = React.useState(initialData?.name || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [address, setAddress] = React.useState(initialData?.address || "");
  const [barangay, setBarangay] = React.useState(initialData?.barangay || "Libertad");
  const [genderRestriction, setGenderRestriction] = React.useState<GenderRestriction>(
    initialData?.gender_restriction || "coed"
  );
  const [curfewPolicy, setCurfewPolicy] = React.useState(initialData?.curfew_policy || "");
  const [visitorPolicy, setVisitorPolicy] = React.useState(initialData?.visitor_policy || "");
  const [contactPhone, setContactPhone] = React.useState(initialData?.contact_phone || "");
  const [contactEmail, setContactEmail] = React.useState(initialData?.contact_email || "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(initialData?.cover_image_url || "");

  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(
    initialData?.amenities || ["High-Speed Wi-Fi", "CCTV Security 24/7"]
  );
  const [selectedRules, setSelectedRules] = React.useState<string[]>(
    initialData?.rules || ["No Smoking inside rooms", "Quiet Hours after 10:00 PM"]
  );

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a boarding house name");
      return;
    }
    if (!address.trim()) {
      toast.error("Please enter the specific street address");
      return;
    }
    if (!barangay) {
      toast.error("Please select a Butuan barangay");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && initialData) {
        const res = await updatePropertyAction(initialData.id, {
          name: name.trim(),
          description: description.trim(),
          address: address.trim(),
          barangay,
          gender_restriction: genderRestriction,
          curfew_policy: curfewPolicy.trim() || undefined,
          visitor_policy: visitorPolicy.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          cover_image_url: coverImageUrl.trim() || undefined,
          amenities: selectedAmenities,
          rules: selectedRules,
        });

        if (!res.success) {
          toast.error(res.error || "Failed to update boarding house");
          setLoading(false);
          return;
        }

        toast.success("Boarding house details updated successfully");
        router.push(`/owner/properties/${initialData.id}`);
        router.refresh();
      } else {
        const res = await createPropertyAction({
          name: name.trim(),
          description: description.trim(),
          address: address.trim(),
          barangay,
          gender_restriction: genderRestriction,
          curfew_policy: curfewPolicy.trim() || undefined,
          visitor_policy: visitorPolicy.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          cover_image_url:
            coverImageUrl.trim() ||
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
          amenities: selectedAmenities,
          rules: selectedRules,
        });

        if (!res.success || !res.property) {
          toast.error(res.error || "Failed to create boarding house");
          setLoading(false);
          return;
        }

        toast.success("Boarding house created! Now add your room units.");
        router.push(`/owner/properties/${res.property.id}/rooms`);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Basic Information Card */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-500" />
            Basic Property Information
          </CardTitle>
          <CardDescription>
            Specify your boarding house name, exact Butuan location, and student accommodation rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold">
                Boarding House Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                required
                placeholder="e.g. FSUU Scholar's Dormitory"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barangay" className="text-xs font-semibold">
                Barangay in Butuan City <span className="text-rose-500">*</span>
              </Label>
              <Select value={barangay} onValueChange={(val) => setBarangay(val || "")}>
                <SelectTrigger id="barangay" className="bg-background">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  {BUTUAN_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs font-semibold">
              Exact Street Address / Landmark <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="address"
              required
              placeholder="e.g. P-3 Montilla Blvd., walking distance to FSUU Main Gate"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold">
              Property Description
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Describe your boarding house atmosphere, proximity to universities, security features, and target boarders..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genderRestriction" className="text-xs font-semibold">
                Gender Restriction Policy
              </Label>
              <Select
                value={genderRestriction}
                onValueChange={(val) => setGenderRestriction(val as GenderRestriction)}
              >
                <SelectTrigger id="genderRestriction" className="bg-background">
                  <SelectValue placeholder="Gender restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coed">Co-ed (All Welcome / Separate Floors)</SelectItem>
                  <SelectItem value="female_only">Female Only</SelectItem>
                  <SelectItem value="male_only">Male Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl" className="text-xs font-semibold">
                Cover Photo URL
              </Label>
              <Input
                id="coverImageUrl"
                placeholder="https://images.unsplash.com/..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* House Rules & Policies Card */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg font-bold">House Rules & Curfew Policies</CardTitle>
          <CardDescription>
            Transparency on curfews and visitors helps match students who respect your house rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curfewPolicy" className="text-xs font-semibold">
                Curfew Policy
              </Label>
              <Input
                id="curfewPolicy"
                placeholder="e.g. 10:00 PM gate lock (Late passes allowed for hospital interns)"
                value={curfewPolicy}
                onChange={(e) => setCurfewPolicy(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitorPolicy" className="text-xs font-semibold">
                Visitor Policy
              </Label>
              <Input
                id="visitorPolicy"
                placeholder="e.g. Visitors welcome in common lobby until 8:00 PM"
                value={visitorPolicy}
                onChange={(e) => setVisitorPolicy(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold block">Select Rules That Apply</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_RULES.map((rule) => {
                const isChecked = selectedRules.includes(rule);
                return (
                  <button
                    type="button"
                    key={rule}
                    onClick={() => toggleRule(rule)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                      isChecked
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-medium"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{rule}</span>
                    {isChecked && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities Card */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Included Amenities</CardTitle>
          <CardDescription>
            Highlight utilities and conveniences that attract Butuan students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMMON_AMENITIES.map((amenity) => {
              const isChecked = selectedAmenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                    isChecked
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-medium"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{amenity}</span>
                  {isChecked && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Landlord Contact Info */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Direct Landlord Contact Details</CardTitle>
          <CardDescription>
            Provided to confirmed boarders and viewing inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-xs font-semibold">
                Contact Phone / GCash Mobile
              </Label>
              <Input
                id="contactPhone"
                placeholder="e.g. 0917-123-4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-xs font-semibold">
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="e.g. landlord@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Submission */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Update Property" : "Publish & Add Rooms"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
