"use client";

import { useRef, useState } from "react";
import type { CapturedPhoto, PhotoType } from "@/lib/types";

export function PhotoCapture({
  photoType,
  existing,
  onCapture,
  onRemove,
}: {
  photoType: PhotoType;
  existing: CapturedPhoto | undefined;
  onCapture: (photo: CapturedPhoto) => void;
  onRemove: () => void;
}) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      // Uploaded at full original size/quality — no client-side compression.
      // The PDF that gets emailed uses a separately resized copy (generated
      // server-side) so email delivery stays reliable regardless.
      const previewUrl = URL.createObjectURL(file);
      onCapture({ photo_type: photoType, file, previewUrl });
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
