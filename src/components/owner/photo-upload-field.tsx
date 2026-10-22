"use client";

import * as React from "react";
import { Upload, Image as ImageIcon, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PropertyImage } from "@/components/ui/property-image";
import { compressImageFile, type CompressionResult } from "@/lib/image-compressor";
import { toast } from "sonner";

interface PhotoUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function PhotoUploadField({
  value,
  onChange,
  className = "",
}: PhotoUploadFieldProps) {
  const [mode, setMode] = React.useState<"upload" | "url">("upload");
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [compressionStats, setCompressionStats] = React.useState<CompressionResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressionStats(null);

    try {
      const result = await compressImageFile(file);
      setCompressionStats(result);
      onChange(result.dataUrl);
      toast.success(
        `Optimized photo! Compressed from ${(result.originalSizeBytes / 1024).toFixed(0)}KB to ${(result.compressedSizeBytes / 1024).toFixed(0)}KB (${result.reductionPercentage}% smaller)`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process photo";
      toast.error(msg);
    } finally {
      setIsCompressing(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    setCompressionStats(null);
  };

  const hasPhoto = Boolean(value?.trim());

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-primary" />
          Cover Photo
        </Label>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/70 text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              mode === "upload"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              mode === "url"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paste URL
          </button>
        </div>
      </div>

      {/* Mode 1: File Upload with Client-Side Compression */}
      {mode === "upload" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            id="property-cover-file-input"
          />

          {!hasPhoto ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 space-y-2"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {isCompressing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  {isCompressing
                    ? "Compressing and resizing photo..."
                    : "Click to select or snap a photo"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  JPEG, PNG, or WebP up to 10MB • Automatically converted to lightweight WebP
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border/70 bg-card">
              <div className="relative aspect-[16/9] w-full bg-muted">
                <PropertyImage
                  src={value}
                  alt="Property cover preview"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 500px"
                  className="object-cover"
                />
              </div>

              {/* Action Controls & Compression Badge */}
              <div className="p-3 bg-card/95 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Cover Photo Ready
                  </Badge>
                  {compressionStats && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {(compressionStats.compressedSizeBytes / 1024).toFixed(0)} KB WebP (-
                      {compressionStats.reductionPercentage}%)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs px-2.5 rounded-md"
                  >
                    Change Photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Direct URL Input */}
      {mode === "url" && (
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="coverImageUrl"
              placeholder="https://images.unsplash.com/photo-..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="bg-background pr-8 text-xs font-mono"
            />
            {hasPhoto && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter an image URL from Unsplash or Supabase Storage.
          </p>

          {hasPhoto && (
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-border/70 bg-muted mt-2">
              <PropertyImage
                src={value}
                alt="Property preview"
                fill
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
