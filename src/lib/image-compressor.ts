/**
 * Client-Side Image Resizer & Compressor for Pabulong
 * Resizes large camera photos to max 1200x1200px and converts to WebP (0.82 quality)
 * Drastically reduces upload bandwidth and storage overhead without third-party dependencies.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
  reductionPercentage: number;
  mimeType: string;
}

const MAX_DIMENSION = 1200; // Optimal balance for Retina mobile & desktop cards
const QUALITY = 0.82;
const MAX_ALLOWED_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit for raw input

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export async function compressImageFile(file: File): Promise<CompressionResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    throw new Error(
      `Unsupported file format (${file.type}). Please upload a JPEG, PNG, or WebP photo.`
    );
  }

  if (file.size > MAX_ALLOWED_FILE_SIZE_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image data."));

      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate aspect-ratio-preserving dimensions
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Canvas context is not available.");
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Try modern WebP first
          let mimeType = "image/webp";
          let dataUrl = canvas.toDataURL(mimeType, QUALITY);

          // If browser doesn't support canvas WebP encoding, fallback to JPEG
          if (!dataUrl.startsWith("data:image/webp")) {
            mimeType = "image/jpeg";
            dataUrl = canvas.toDataURL(mimeType, QUALITY);
          }

          // Compute compressed size from base64 string
          const base64Length = dataUrl.split(",")[1]?.length || 0;
          const compressedSizeBytes = Math.round((base64Length * 3) / 4);

          const reductionPercentage = Math.max(
            0,
            Math.round(
              ((file.size - compressedSizeBytes) / file.size) * 100
            )
          );

          resolve({
            dataUrl,
            originalSizeBytes: file.size,
            compressedSizeBytes,
            width,
            height,
            reductionPercentage,
            mimeType,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
