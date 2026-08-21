"use client";

import { useState } from "react";

export function ResendButton({ submissionRecordId }: { submissionRecordId: string }) {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/submissions/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionRecordId, force: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error || "Unknown error");
        return;
      }
      setStatus("done");
      setMessage(json.warning || "PDF regenerated and email sent.");
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Network error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "busy"}
        className="min-h-touch px-4 flex items-center justify-center rounded-xl border-2 border-line text-paper font-bold text-sm disabled:opacity-50"
      >
        {status === "busy" ? "Working..." : "Resend PDF & Email"}
      </button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-bad" : "text-paper/60"}`}>{message}</p>
      )}
    </div>
  );
}
