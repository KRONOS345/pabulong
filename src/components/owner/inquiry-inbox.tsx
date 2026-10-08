"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { updateInquiryStatusAction } from "@/actions/marketplace";
import type { Inquiry, InquiryStatus, BoardingHouse } from "@/lib/marketplace-types";

const ALL_STATUSES: { value: InquiryStatus; label: string; color: string }[] = [
  { value: "new", label: "New Inquiry", color: "bg-purple-950/40 text-purple-300 border-purple-500/40" },
  { value: "replied", label: "Replied", color: "bg-blue-950/40 text-blue-300 border-blue-500/40" },
  { value: "viewing_requested", label: "Viewing Requested", color: "bg-amber-950/40 text-amber-300 border-amber-500/40" },
  { value: "viewing_scheduled", label: "Viewing Scheduled", color: "bg-emerald-950/40 text-emerald-300 border-emerald-500/40" },
  { value: "closed", label: "Closed / Resolved", color: "bg-zinc-800 text-zinc-400 border-zinc-700" },
];

interface InquiryInboxProps {
  initialInquiries: Inquiry[];
  properties: BoardingHouse[];
}

export function InquiryInbox({ initialInquiries, properties }: InquiryInboxProps) {
  const [inquiries, setInquiries] = React.useState<Inquiry[]>(initialInquiries);
  const [propertyFilter, setPropertyFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredInquiries = React.useMemo(() => {
    return inquiries.filter((inq) => {
      if (propertyFilter !== "all" && inq.boarding_house_id !== propertyFilter) {
        return false;
      }
      if (statusFilter !== "all" && inq.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [inquiries, propertyFilter, statusFilter]);

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    const previous = inquiries;
    // Optimistic update
    setInquiries((prev) =>
      prev.map((i) => (i.id === inquiryId ? { ...i, status: newStatus } : i))
    );

    try {
      const res = await updateInquiryStatusAction(inquiryId, newStatus);
      if (!res.success) {
        setInquiries(previous);
        toast.error(res.error || "Failed to update inquiry status");
      } else {
        toast.success(`Inquiry status updated to ${newStatus.replace("_", " ")}`);
      }
    } catch {
      setInquiries(previous);
      toast.error("Failed to update inquiry status");
    }
  };

  const getStatusBadge = (status: InquiryStatus) => {
    const found = ALL_STATUSES.find((s) => s.value === status);
    return (
      <Badge
        variant="outline"
        className={`text-xs capitalize font-medium px-2 py-0.5 border ${
          found?.color || "bg-muted text-muted-foreground"
        }`}
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="border-border/60 bg-card/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Filter Leads ({filteredInquiries.length})
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Property Selector */}
            <div className="w-full sm:w-56">
              <Select value={propertyFilter} onValueChange={(val) => setPropertyFilter(val || "all")}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boarding Houses</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(propertyFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPropertyFilter("all");
                  setStatusFilter("all");
                }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Inquiry List */}
      {filteredInquiries.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-card/40 text-center py-16 px-4">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">
              No inquiries found
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {inquiries.length === 0
                ? "You haven't received any seeker inquiries yet. Once students browse your boarding houses, their messages will appear here."
                : "No inquiries match your current filter selection. Try resetting filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <Card
              key={inquiry.id}
              className="border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-border transition-colors overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header: Seeker & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                      {inquiry.seeker?.full_name?.charAt(0).toUpperCase() || (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {inquiry.seeker?.full_name || "Prospective Boarder"}
                        </span>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {inquiry.seeker?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-500" />
                            {inquiry.seeker.phone}
                          </span>
                        )}
                        {inquiry.seeker?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {inquiry.seeker.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown Controller */}
                  <div className="self-end sm:self-center flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-background">
                            Update Status
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 bg-card">
                        <DropdownMenuLabel className="text-xs">
                          Change Inquiry Status
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_STATUSES.map((statusItem) => (
                          <DropdownMenuItem
                            key={statusItem.value}
                            onClick={() => handleStatusChange(inquiry.id, statusItem.value)}
                            className="text-xs flex items-center justify-between cursor-pointer"
                          >
                            <span>{statusItem.label}</span>
                            {inquiry.status === statusItem.value && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Property & Room Context */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 rounded-lg bg-muted/40 border border-border/40">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Boarding House Target:
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                      {inquiry.boarding_house?.name || "Boarding House"}
                    </span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5 truncate">
                      {inquiry.boarding_house?.address}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Requested Room / Unit:
                    </span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {inquiry.room?.room_number
                        ? `Room ${inquiry.room.room_number} (${inquiry.room.room_type || "solo"}) — ₱${inquiry.room.monthly_rent?.toLocaleString()}/mo`
                        : "General Boarding House Inquiry"}
                    </span>

                    {inquiry.target_move_in && (
                      <span className="text-muted-foreground text-[11px] inline-flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-amber-500" />
                        Target Move-in:{" "}
                        <strong className="text-foreground font-medium">
                          {inquiry.target_move_in}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Seeker Message Body */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Message from Seeker:
                  </span>
                  <div className="p-3 rounded-lg bg-background border text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {inquiry.message}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Submitted: {new Date(inquiry.created_at).toLocaleString()}
                  </span>

                  {inquiry.boarding_house_id && (
                    <Link
                      href={`/properties/${inquiry.boarding_house_id}`}
                      target="_blank"
                      className="text-emerald-500 hover:underline inline-flex items-center gap-1"
                    >
                      View Public Listing
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
