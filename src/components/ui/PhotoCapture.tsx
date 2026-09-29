"use client";

import { useRef, useState } from "react";
import type { CapturedPhoto } from "@/lib/types";

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = objectUrl;
  });
}

// Burns a "DD/MM/YYYY, HH:MM:SS" stamp of the moment the photo was taken/
// picked into the bottom-left corner of the image itself, the same way a
// dedicated timestamp-camera app would — so the evidence travels with the
// photo (into the PDF, into a forwarded email, wherever) rather than only
// living in a database column no one sees when looking at the image.
//
// Uses a plain <img> + canvas rather than createImageBitmap(file, { imageOrientation })
// — that options object throws on some browser/OS versions (an earlier
// attempt silently fell back to "no stamp" on affected devices), whereas
// every browser that can render an <img> tag can draw it onto a canvas.
async function addTimestamp(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx || canvas.width === 0 || canvas.height === 0) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const stamp = new Date().toLocaleString("en-NZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const fontSize = Math.max(32, Math.round(canvas.width * 0.045));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const paddingX = fontSize * 0.6;
    const paddingY = fontSize * 0.5;
    const bandHeight = fontSize + paddingY * 2;

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, canvas.height - bandHeight, canvas.width, bandHeight);

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(stamp, paddingX, canvas.height - bandHeight / 2);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    if (!blob) return file;
    const stampedName = file.name.replace(/\.\w+$/, "") + "-stamped.jpg";
    return new File([blob], stampedName, { type: "image/jpeg" });
  } catch {
    // Any failure (decode error, canvas unsupported) — fall back to the
    // original, unstamped file rather than blocking the submission.
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function PhotoCapture({
  photoType,
  existing,
  onCapture,
  onRemove,
  stampTimestamp,
}: {
  photoType: string;
  existing: CapturedPhoto | undefined;
  onCapture: (photo: CapturedPhoto) => void;
  onRemove: () => void;
  stampTimestamp?: boolean;
}) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      // Uploaded at full original size/quality — no client-side compression
      // beyond the timestamp re-encode below. The PDF that gets emailed uses
      // a separately resized copy (generated server-side) so email delivery
      // stays reliable regardless.
      const finalFile = stampTimestamp ? await addTimestamp(file) : file;
      const previewUrl = URL.createObjectURL(finalFile);
      onCapture({ photo_type: photoType, file: finalFile, previewUrl });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-line bg-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-paper">{photoType}</span>
        {existing && (
          <button type="button" onClick={onRemove} className="text-bad text-sm font-semibold">
            Remove
          </button>
        )}
      </div>

      {existing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={existing.previewUrl} alt={photoType} className="w-full h-40 object-cover rounded-lg" />
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => uploadInputRef.current?.click()}
          className="w-full min-h-touch rounded-xl bg-accent text-ink font-bold disabled:opacity-50"
        >
          {busy ? "Processing..." : "Upload Photo"}
        </button>
      )}

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
