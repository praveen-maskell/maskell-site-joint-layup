"use client";

import { useRef } from "react";
import { useWizardStore } from "@/store/wizard-store";
import { PhotoCapture } from "@/components/ui/PhotoCapture";
import { WizardNav } from "@/components/wizard/WizardNav";
import type { PhotoType } from "@/lib/types";

const REQUIRED_PHOTOS: PhotoType[] = ["Joint Before Work", "Completed Joint / Layup"];

export default function PhotosStep() {
  const { data, addPhoto, removePhoto } = useWizardStore();
  const extraInputRef = useRef<HTMLInputElement>(null);

  function findPhoto(type: PhotoType) {
    return data.photos.find((p) => p.photo_type === type);
  }

  const extraPhotos = data.photos
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => p.photo_type === "Additional Photo");

  async function handleExtraFile(file: File | undefined) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    addPhoto({ photo_type: "Additional Photo", file, previewUrl });
  }

  function validate() {
    const missing = REQUIRED_PHOTOS.filter((t) => !findPhoto(t));
    if (missing.length) {
      alert(`Photos required: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-paper">Photos</h1>
      <p className="text-paper/60 text-sm">These two photos are required as QA evidence. Add more if needed.</p>

      {REQUIRED_PHOTOS.map((type) => (
        <PhotoCapture
          key={type}
          photoType={type}
          existing={findPhoto(type)}
          onCapture={addPhoto}
          onRemove={() => {
            const idx = data.photos.findIndex((p) => p.photo_type === type);
            if (idx >= 0) removePhoto(idx);
          }}
        />
      ))}

      {extraPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {extraPhotos.map(({ p, index }) => (
            <div key={index} className="rounded-xl border-2 border-line bg-panel p-2 space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="Additional" className="w-full h-28 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="w-full text-bad text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => extraInputRef.current?.click()}
        className="w-full min-h-touch rounded-xl border-2 border-dashed border-line text-paper/60 font-semibold"
      >
        + Add Another Photo
      </button>
      <input
        ref={extraInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleExtraFile(e.target.files?.[0])}
      />

      <WizardNav backHref="/new/inspection" nextHref="/new/review" onBeforeNext={validate} />
    </div>
  );
}
