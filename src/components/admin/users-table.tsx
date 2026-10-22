"use client";

import * as React from "react";
import {
  Users,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { toast } from "sonner";
import {
  toggleUserVerificationAction,
  updateUserRoleAction,
} from "@/actions/admin";
import type { Profile, UserRole } from "@/lib/marketplace-types";

interface UsersTableProps {
  initialUsers: Profile[];
  currentAdminId?: string;
}

export function UsersTable({ initialUsers, currentAdminId }: UsersTableProps) {
  const [users, setUsers] = React.useState<Profile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [isPending, startTransition] = React.useTransition();

  // Role switch dialog state
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<Profile | null>(null);
  const [targetNewRole, setTargetNewRole] = React.useState<"seeker" | "owner">("owner");

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesQuery;
    });
  }, [users, roleFilter, searchQuery]);

  const handleToggleVerification = (user: Profile) => {
    const nextVerified = !user.is_verified;
    startTransition(async () => {
      const res = await toggleUserVerificationAction(user.id, nextVerified);
      if (res.success) {
        toast.success(
          nextVerified
            ? `Verified account for ${user.full_name}.`
            : `Revoked verification for ${user.full_name}.`
        );
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...item, is_verified: nextVerified } : item
          )
        );
      } else {
        toast.error(res.error || "Failed to update verification status.");
      }
    });
  };

  const handleOpenRoleModal = (user: Profile) => {
    if (user.id === currentAdminId) {
      toast.error("Security constraint: You cannot modify your own administrative role.");
      return;
    }
    if (user.role === "admin") {
      toast.error("Security constraint: Administrator accounts cannot be modified via the web interface.");
      return;
    }
    setSelectedUser(user);
    setTargetNewRole(user.role === "seeker" ? "owner" : "seeker");
    setRoleModalOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (!selectedUser) return;

    startTransition(async () => {
      const res = await updateUserRoleAction(selectedUser.id, targetNewRole);
      if (res.success) {
        toast.success(
          `Updated role for ${selectedUser.full_name} to '${targetNewRole}'.`
        );
        setUsers((prev) =>
          prev.map((item) =>
            item.id === selectedUser.id ? { ...item, role: targetNewRole } : item
          )
        );
        setRoleModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update user role.");
      }
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <Badge
            variant="outline"
            className="border-indigo-500/40 text-indigo-400 bg-indigo-950/20 font-semibold"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "owner":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 font-medium"
          >
            Landlord / Owner
          </Badge>
        );
      case "seeker":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/40 text-blue-400 bg-blue-950/20 font-medium"
          >
            Seeker / Student
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const roleTabs = [
    { id: "all", label: "All Users" },
    { id: "seeker", label: "Seekers" },
    { id: "owner", label: "Landlords" },
    { id: "admin", label: "Admins" },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Role Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-card border-border/70"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {roleTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={roleFilter === tab.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRoleFilter(tab.id)}
              className={`text-xs h-8 whitespace-nowrap ${
                roleFilter === tab.id
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[300px]">User Identity</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No users found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search query or role filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentAdminId;
                const isAdmin = user.role === "admin";
                const initials = (user.full_name || "User")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow key={user.id} className="border-border/40 hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                          <AvatarFallback className="text-xs font-semibold bg-muted">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {user.full_name || "Anonymous User"}
                            </span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-border text-muted-foreground">
                                You
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email || "No email linked"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_verified ? (
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
                    <TableCell className="text-xs text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Verification Badge */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggleVerification(user)}
                          title={user.is_verified ? "Revoke Verification" : "Grant Verification"}
                          className={`h-8 text-xs gap-1 ${
                            user.is_verified
                              ? "text-muted-foreground hover:text-rose-400"
                              : "text-emerald-400 hover:text-emerald-300"
                          }`}
                        >
                          {user.is_verified ? (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Unverify</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Verify</span>
                            </>
                          )}
                        </Button>

                        {/* Switch Role Button */}
                        {isSelf || isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title={isSelf ? "Self-role change is disabled" : "Admin role is protected"}
                            className="h-8 text-xs text-muted-foreground/50 cursor-not-allowed gap-1"
                          >
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">Protected</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleOpenRoleModal(user)}
                            className="h-8 text-xs gap-1"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {user.role === "seeker" ? "Make Landlord" : "Make Seeker"}
                            </span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-400" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Update the platform role for &quot;{selectedUser?.full_name}&quot; from{" "}
              <span className="font-semibold text-foreground capitalize">{selectedUser?.role}</span> to{" "}
              <span className="font-semibold text-foreground capitalize">{targetNewRole}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted-foreground leading-relaxed space-y-2 bg-muted/40 p-3 rounded-lg border border-border/60">
            <p>
              • <strong>Seeker:</strong> Can browse, compare, favorite, and submit inquiries for rooms.
            </p>
            <p>
              • <strong>Landlord / Owner:</strong> Can register boarding houses, configure rooms, update vacancies, and chat with applicants.
            </p>
            <p className="text-[11px] text-amber-400 font-medium pt-1">
              Note: Administrative roles cannot be provisioned through this interface.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRoleChange}
              disabled={isPending}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Role Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
