"use client";

import * as React from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/actions/marketplace";

interface FavoriteButtonProps {
  boardingHouseId: string;
  initialFavorited?: boolean;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
  showText?: boolean;
  onToggled?: (isFav: boolean) => void;
}

export function FavoriteButton({
  boardingHouseId,
  initialFavorited = false,
  size = "icon",
  variant = "ghost",
  className = "",
  showText = false,
  onToggled,
}: FavoriteButtonProps) {
  const { isSignedIn } = useAuth();
  const [favoritedOverride, setFavoritedOverride] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const isFavorited = favoritedOverride !== null ? favoritedOverride : initialFavorited;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      toast.info("Sign in required", {
        description: "Please sign in to save boarding houses to your favorites.",
      });
      return;
    }

    if (isLoading) return;

    // Optimistic toggle
    const previousState = isFavorited;
    const nextState = !previousState;
    setFavoritedOverride(nextState);
    setIsLoading(true);

    try {
      const res = await toggleFavoriteAction(boardingHouseId);
      if (!res.success) {
        // Rollback on failure
        setFavoritedOverride(previousState);
        toast.error("Failed to update favorite", {
          description: res.error || "Please try again later.",
        });
      } else {
        const actualState = res.isFavorite ?? nextState;
        setFavoritedOverride(actualState);
        onToggled?.(actualState);
        if (actualState) {
          toast.success("Saved to favorites");
        } else {
          toast.success("Removed from favorites");
        }
      }
    } catch (err: unknown) {
      setFavoritedOverride(previousState);
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error("Error updating favorite", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isLoading}
      onClick={handleToggle}
      className={`relative transition-all duration-200 select-none ${
        isFavorited
          ? "text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
      aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={isFavorited}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-transform ${
            isFavorited
              ? "fill-rose-500 text-rose-500 scale-110"
              : "stroke-current text-current"
          }`}
        />
      )}
      {showText && (
        <span className="ml-2 text-xs font-medium">
          {isFavorited ? "Saved" : "Save"}
        </span>
      )}
    </Button>
  );
}
