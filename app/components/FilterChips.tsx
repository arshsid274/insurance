"use client";

import type { ProviderType } from "@/lib/types";
import { TypeIcon } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";
import type { TKey } from "@/lib/i18n";

const ORDER: ProviderType[] = [
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Diagnostics",
  "Day Surgery Center",
  "Optical Center",
];

const LABEL_KEY: Record<ProviderType, TKey> = {
  Hospital: "typeHospital",
  Clinic: "typeClinic",
  Pharmacy: "typePharmacy",
  Diagnostics: "typeDiagnostics",
  "Day Surgery Center": "typeDaySurgery",
  "Optical Center": "typeOptical",
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
  const { t } = useLanguage();
  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label={t("filterGroupLabel")}
    >
      {ORDER.map((type) => {
        const n = counts.get(type) ?? 0;
        if (n === 0) return null;
        const isOn = active.has(type);
        return (
          <button
            key={type}
            type="button"
            className="chip"
            aria-pressed={isOn}
            onClick={() => onToggle(type)}
          >
            <TypeIcon type={type} className="h-3.5 w-3.5" />
            <span>{t(LABEL_KEY[type])}</span>
            <span className="text-[11px] opacity-70">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
