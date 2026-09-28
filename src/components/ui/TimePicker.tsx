"use client";

import { useState } from "react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = [0, 15, 30, 45];

function parse24h(value: string): { hour12: number; minute: number; ampm: "AM" | "PM" } | null {
  if (!value) return null;
  const [hStr, mStr] = value.split(":");
  const hour24 = Number(hStr);
  const minute = Number(mStr);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return null;
  const ampm: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, ampm };
}

function to24h(hour12: number, minute: number, ampm: "AM" | "PM"): string {
  let hour24 = hour12 % 12;
  if (ampm === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDisplay(value: string): string {
  const parsed = parse24h(value);
  if (!parsed) return "Select time";
  return `${parsed.hour12}:${String(parsed.minute).padStart(2, "0")} ${parsed.ampm}`;
}

export function TimePicker({
  label, value, onChange, required,
}: {
  label: string;
  value: string; // "HH:MM" 24h, or ""
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const parsed = parse24h(value);
  const [hour12, setHour12] = useState<number | null>(parsed?.hour12 ?? null);
  const [minute, setMinute] = useState<number | null>(parsed?.minute ?? null);
  const [ampm, setAmpm] = useState<"AM" | "PM" | null>(parsed?.ampm ?? null);

  function openPicker() {
    const p = parse24h(value);
    setHour12(p?.hour12 ?? null);
    setMinute(p?.minute ?? null);
    setAmpm(p?.ampm ?? null);
    setOpen(true);
  }

  function apply(h: number | null, m: number | null, a: "AM" | "PM" | null) {
    if (h !== null && m !== null && a !== null) {
      onChange(to24h(h, m, a));
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-paper/80 mb-1">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <button
        type="button"
        onClick={openPicker}
        className={`w-full min-h-touch rounded-xl bg-ink border-2 border-line px-4 text-lg text-left focus:border-accent focus:outline-none ${
          value ? "text-paper" : "text-paper/40"
        }`}
      >
        {formatDisplay(value)}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-panel border-t-2 border-line p-4 pb-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-paper font-bold">{label}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-paper/50 text-sm font-semibold">
                Close
              </button>
            </div>

            <div>
              <p className="text-paper/50 text-xs mb-2 uppercase tracking-wide">Hour</p>
              <div className="grid grid-cols-4 gap-2">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setHour12(h);
                      apply(h, minute, ampm);
                    }}
                    className={`min-h-touch rounded-xl text-base font-semibold border-2 active:scale-[0.98] ${
                      hour12 === h ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-paper/50 text-xs mb-2 uppercase tracking-wide">Minute</p>
              <div className="grid grid-cols-4 gap-2">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinute(m);
                      apply(hour12, m, ampm);
                    }}
                    className={`min-h-touch rounded-xl text-base font-semibold border-2 active:scale-[0.98] ${
                      minute === m ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"
                    }`}
                  >
                    :{String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-paper/50 text-xs mb-2 uppercase tracking-wide">AM / PM</p>
              <div className="grid grid-cols-2 gap-2">
                {(["AM", "PM"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmpm(a);
                      apply(hour12, minute, a);
                    }}
                    className={`min-h-touch rounded-xl text-base font-semibold border-2 active:scale-[0.98] ${
                      ampm === a ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={hour12 === null || minute === null || ampm === null}
              onClick={() => setOpen(false)}
              className="w-full min-h-touch rounded-xl bg-accent text-ink font-extrabold text-lg disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
