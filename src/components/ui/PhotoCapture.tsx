"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
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
      // Compress but keep QA-usable quality — cap at 1920px / ~1.5MB
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1920,
        maxSizeMB: 1.5,
        useWebWorker: true,
        initialQuality: 0.85,
      });
      const previewUrl = URL.createObjectURL(compressed);
      onCapture({ photo_type: photoType, file: compressed as File, previewUrl });
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
