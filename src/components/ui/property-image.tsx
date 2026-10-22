"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { Building2 } from "lucide-react";

export const DEFAULT_PROPERTY_PHOTO =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

const ALLOWED_HOSTS = [
  "images.unsplash.com",
  "supabase.co",
  "img.clerk.com",
  "images.clerk.dev",
];

function isHostOptimizable(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/") || url.startsWith("data:")) return true;
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export interface PropertyImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  containerClassName?: string;
}

export function PropertyImage({
  src,
  alt,
  fallbackSrc = DEFAULT_PROPERTY_PHOTO,
  fill = true,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px",
  priority = false,
  className = "",
  containerClassName = "",
  ...props
}: PropertyImageProps) {
  const [prevSrc, setPrevSrc] = React.useState<string | null | undefined>(src);
  const [currentSrc, setCurrentSrc] = React.useState<string>(() => src || fallbackSrc);
  const [hasError, setHasError] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Sync state during render when src prop changes (React recommended pattern)
  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrentSrc(src || fallbackSrc);
    setHasError(false);
    setIsLoading(true);
  }

  const canOptimize = isHostOptimizable(currentSrc);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-muted/60 text-muted-foreground select-none p-4 ${containerClassName}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="h-8 w-8 text-muted-foreground/60 mb-1" />
        <span className="text-[11px] font-medium text-center">Photo unavailable</span>
      </div>
    );
  }

  // Handle data URIs (e.g. from client-side compressor)
  const isDataUri = currentSrc.startsWith("data:");

  return (
    <>
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted/70 animate-pulse pointer-events-none z-0"
          aria-hidden="true"
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={!canOptimize || isDataUri}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${className}`}
        {...props}
      />
    </>
  );
}
