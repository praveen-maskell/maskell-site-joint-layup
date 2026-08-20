"use client";

import { useWizardStore } from "@/store/wizard-store";
import { PhotoCapture } from "@/components/ui/PhotoCapture";
import { WizardNav } from "@/components/wizard/WizardNav";
import type { PhotoType } from "@/lib/types";

const REQUIRED_PHOTOS: PhotoType[] = ["Joint Before Work", "Completed Joint / Layup", "Final Inspection"];

export default function PhotosStep() {
  const { data, addPhoto, removePhoto } = useWizardStore();

  function findPhoto(type: PhotoType) {
    return data.photos.find((p) => p.photo_type === type);
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
      <p className="text-paper/60 text-sm">All three photos are required as QA evidence.</p>

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

      <WizardNav backHref="/new/inspection" nextHref="/new/review" onBeforeNext={validate} />
    </div>
  );
}
