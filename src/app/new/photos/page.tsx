"use client";

import { useRef } from "react";
import { useWizardStore } from "@/store/wizard-store";
import { PhotoCapture } from "@/components/ui/PhotoCapture";
import { WizardNav } from "@/components/wizard/WizardNav";
import type { PhotoType } from "@/lib/types";

export default function PhotosStep() {
  const { data, addPhoto, removePhoto } = useWizardStore();
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  function findPhoto(type: PhotoType) {
    return data.photos.find((p) => p.photo_type === type);
  }

  function photosOfType(type: PhotoType) {
    return data.photos
      .map((p, index) => ({ p, index }))
      .filter(({ p }) => p.photo_type === type);
  }

  const beforePhotos = photosOfType("Joint Before Work");
  const extraPhotos = photosOfType("Additional Photo");

  async function handleFile(file: File | undefined, photoType: PhotoType) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    addPhoto({ photo_type: photoType, file, previewUrl });
  }

  function validate() {
    const missing: string[] = [];
    if (beforePhotos.length === 0) missing.push("Joint Before Work");
    if (!findPhoto("Completed Joint / Layup")) missing.push("Completed Joint / Layup");
    if (missing.length) {
      alert(`Photos required: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-paper">Photos</h1>
      <p className="text-paper/60 text-sm">Before Weld and Completed Joint are required as QA evidence. Add more if needed.</p>

      <div className="space-y-2">
        <span className="font-semibold text-paper">Joint Before Work <span className="text-accent">*</span></span>
        {beforePhotos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.map(({ p, index }) => (
              <div key={index} className="rounded-xl border-2 border-line bg-panel p-2 space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="Joint Before Work" className="w-full h-28 object-cover rounded-lg" />
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
          onClick={() => beforeInputRef.current?.click()}
          className="w-full min-h-touch rounded-xl bg-accent text-ink font-bold"
        >
          {beforePhotos.length > 0 ? "+ Add Another Before-Weld Photo" : "Upload Photo"}
        </button>
        <input
          ref={beforeInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0], "Joint Before Work")}
        />
      </div>

      <PhotoCapture
        photoType="Completed Joint / Layup"
        existing={findPhoto("Completed Joint / Layup")}
        onCapture={addPhoto}
        onRemove={() => {
          const idx = data.photos.findIndex((p) => p.photo_type === "Completed Joint / Layup");
          if (idx >= 0) removePhoto(idx);
        }}
      />

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
        onChange={(e) => handleFile(e.target.files?.[0], "Additional Photo")}
      />

      <WizardNav backHref="/new/inspection" nextHref="/new/review" onBeforeNext={validate} />
    </div>
  );
}
