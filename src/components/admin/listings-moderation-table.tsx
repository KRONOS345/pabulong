"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  Star,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  approveListingAction,
  rejectListingAction,
  suspendListingAction,
  restoreListingAction,
  toggleListingFeaturedAction,
} from "@/actions/admin";
import type { BoardingHouse, ListingStatus } from "@/lib/marketplace-types";

interface ListingsModerationTableProps {
  initialListings: BoardingHouse[];
}

export function ListingsModerationTable({
  initialListings,
}: ListingsModerationTableProps) {
  const [listings, setListings] = React.useState<BoardingHouse[]>(initialListings);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isPending, startTransition] = React.useTransition();

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [selectedHouse, setSelectedHouse] = React.useState<BoardingHouse | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  // Suspend modal state
  const [suspendModalOpen, setSuspendModalOpen] = React.useState(false);
  const [suspendReason, setSuspendReason] = React.useState("");

  const filteredListings = React.useMemo(() => {
    return listings.filter((h) => {
      const matchesStatus =
        statusFilter === "all" ? true : h.status === statusFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.barangay?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [listings, statusFilter, searchQuery]);

  const handleApprove = (house: BoardingHouse) => {
    startTransition(async () => {
      const res = await approveListingAction(house.id);
      if (res.success) {
        toast.success(`Approved "${house.name}" and published to marketplace.`);
        setListings((prev) =>
          prev.map((item) =>
            item.id === house.id
              ? { ...item, status: "published" as ListingStatus, is_verified: true }
              : item
          )
        );
      } else {
        toast.error(res.error || "Failed to approve listing.");
      }
    });
  };

  const handleOpenReject = (house: BoardingHouse) => {
    setSelectedHouse(house);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedHouse) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Please provide a rejection reason (minimum 5 characters).");
      return;
    }

    startTransition(async () => {
      const res = await rejectListingAction(selectedHouse.id, rejectReason.trim());
      if (res.success) {
        toast.success(`Rejected "${selectedHouse.name}". Reason recorded.`);
        setListings((prev) =>
          prev.map((item) =>
            item.id === selectedHouse.id
              ? { ...item, status: "rejected" as ListingStatus }
              : item
          )
        );
        setRejectModalOpen(false);
      } else {
        toast.error(res.error || "Failed to reject listing.");
      }
    });
  };

  const handleOpenSuspend = (house: BoardingHouse) => {
    setSelectedHouse(house);
    setSuspendReason("");
    setSuspendModalOpen(true);
  };

  const handleConfirmSuspend = () => {
    if (!selectedHouse) return;

    startTransition(async () => {
      const res = await suspendListingAction(selectedHouse.id, suspendReason.trim());
      if (res.success) {
        toast.success(`Suspended "${selectedHouse.name}". Removed from public discovery.`);
        setListings((prev) =>
          prev.map((item) =>
            item.id === selectedHouse.id
              ? { ...item, status: "suspended" as ListingStatus }
              : item
          )
        );
        setSuspendModalOpen(false);
      } else {
        toast.error(res.error || "Failed to suspend listing.");
      }
    });
  };

  const handleRestore = (house: BoardingHouse) => {
    startTransition(async () => {
      const res = await restoreListingAction(house.id);
      if (res.success) {
        toast.success(`Restored "${house.name}" to published marketplace.`);
        setListings((prev) =>
          prev.map((item) =>
            item.id === house.id
              ? { ...item, status: "published" as ListingStatus }
              : item
          )
        );
      } else {
        toast.error(res.error || "Failed to restore listing.");
      }
    });
  };

  const handleToggleFeatured = (house: BoardingHouse) => {
    const nextFeatured = !house.featured;
    startTransition(async () => {
      const res = await toggleListingFeaturedAction(house.id, nextFeatured);
      if (res.success) {
        toast.success(
          nextFeatured
            ? `Marked "${house.name}" as Featured.`
            : `Removed Featured badge from "${house.name}".`
        );
        setListings((prev) =>
          prev.map((item) =>
            item.id === house.id ? { ...item, featured: nextFeatured } : item
          )
        );
      } else {
        toast.error(res.error || "Failed to toggle featured status.");
      }
    });
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case "published":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 font-medium"
          >
            Published
          </Badge>
        );
      case "pending_review":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 bg-amber-950/20 font-medium"
          >
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/40 text-rose-400 bg-rose-950/20 font-medium"
          >
            Rejected
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            variant="outline"
            className="border-red-500/40 text-red-400 bg-red-950/20 font-medium"
          >
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-border text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  const statusTabs = [
    { id: "all", label: "All Listings" },
    { id: "pending_review", label: "Pending Review" },
    { id: "published", label: "Published" },
    { id: "suspended", label: "Suspended" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search house, barangay, or landlord..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-card border-border/70"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={statusFilter === tab.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs h-8 whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Moderation Table */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[300px]">Boarding House</TableHead>
              <TableHead>Landlord</TableHead>
              <TableHead>Barangay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Moderation Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No boarding houses found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search query or status filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredListings.map((house) => (
                <TableRow key={house.id} className="border-border/40 hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted border border-border/60 overflow-hidden relative shrink-0 flex items-center justify-center">
                        {house.cover_image_url ? (
                          <Image
                            src={house.cover_image_url}
                            alt={house.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/listings/${house.id}`}
                          target="_blank"
                          className="font-semibold text-sm text-foreground hover:underline truncate flex items-center gap-1 group"
                        >
                          <span className="truncate">{house.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </Link>
                        <span className="text-xs text-muted-foreground truncate">
                          {house.address || "Butuan City"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">
                        {house.owner?.full_name || "Unknown Landlord"}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {house.owner?.email || "No email"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {house.barangay || "Butuan City"}
                  </TableCell>
                  <TableCell>{getStatusBadge(house.status)}</TableCell>
                  <TableCell>
                    {house.is_verified ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 text-[11px]"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unverified</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Featured Star Toggle */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        onClick={() => handleToggleFeatured(house)}
                        title={house.featured ? "Remove featured" : "Feature listing"}
                        className={house.featured ? "text-amber-400" : "text-muted-foreground"}
                      >
                        <Star
                          className={`h-4 w-4 ${house.featured ? "fill-amber-400" : ""}`}
                        />
                      </Button>

                      {/* Pending Review Actions */}
                      {house.status === "pending_review" && (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleApprove(house)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleOpenReject(house)}
                            className="h-8 text-xs gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Published Actions */}
                      {house.status === "published" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleOpenSuspend(house)}
                          className="h-8 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-950/20 gap-1"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      )}

                      {/* Suspended Actions */}
                      {house.status === "suspended" && (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleRestore(house)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </Button>
                      )}

                      {/* Rejected Actions */}
                      {house.status === "rejected" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleApprove(house)}
                          className="h-8 text-xs gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Listing Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Reject Boarding House
            </DialogTitle>
            <DialogDescription>
              Specify the reason for rejecting &quot;{selectedHouse?.name}&quot;. This explanation will be recorded in the moderation audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Inadequate photos of bathroom, unclear room pricing, or unverified contact information..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="resize-none text-sm bg-card"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 5 characters. Landlords will receive this feedback to revise their listing.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isPending || rejectReason.trim().length < 5}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Listing Dialog */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Ban className="h-5 w-5" />
              Suspend Listing
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend &quot;{selectedHouse?.name}&quot;? It will be immediately hidden from student search and discovery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Optional: State reason for suspension (e.g. multiple scam reports, tenant safety violation)..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              className="resize-none text-sm bg-card"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspend}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Suspend Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
