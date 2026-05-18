"use client";

import type { ProviderType } from "@/lib/types";
import { TypeIcon } from "./icons";

const ORDER: ProviderType[] = [
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Diagnostics",
  "Day Surgery Center",
  "Optical Center",
];

const SHORT: Record<ProviderType, string> = {
  Hospital: "Hospitals",
  Clinic: "Clinics",
  Pharmacy: "Pharmacies",
  Diagnostics: "Diagnostics",
  "Day Surgery Center": "Day Surgery",
  "Optical Center": "Optical",
};

export default function FilterChips({
  counts,
  active,
  onToggle,
}: {
  counts: Map<ProviderType, number>;
  active: Set<ProviderType>;
  onToggle: (t: ProviderType) => void;
}) {
  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="Filter providers by type"
    >
      {ORDER.map((t) => {
        const n = counts.get(t) ?? 0;
        if (n === 0) return null;
        const isOn = active.has(t);
        return (
          <button
            key={t}
            type="button"
            className="chip"
            aria-pressed={isOn}
            onClick={() => onToggle(t)}
          >
            <TypeIcon type={t} className="h-3.5 w-3.5" />
            <span>{SHORT[t]}</span>
            <span className="text-[11px] opacity-70">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
