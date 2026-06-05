"use client";

import { useEffect, useRef } from "react";
import type { Provider } from "@/lib/types";
import { formatDistance } from "@/lib/distance";
import { TypeIcon } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";

type ProviderWithDistance = Provider & { distance?: number };

export default function ProviderList({
  providers,
  selectedId,
  onSelect,
  hasUserLocation,
  onResetFilters,
}: {
  providers: ProviderWithDistance[];
  selectedId: number | null;
  onSelect: (p: Provider) => void;
  hasUserLocation: boolean;
  onResetFilters: () => void;
}) {
  const { t } = useLanguage();
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll selected into view
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${selectedId}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  if (providers.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-base font-semibold text-[var(--color-text)]">
          {t("noResultsTitle")}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t("noResultsBody")}
        </p>
        <button type="button" className="btn-ghost !min-h-[40px]" onClick={onResetFilters}>
          {t("resetFilters")}
        </button>
      </div>
    );
  }

  return (
    <ul
      ref={listRef}
      role="listbox"
      aria-label={t("providerResults")}
      className="h-full overflow-y-auto"
      onKeyDown={(e) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
        const items = listRef.current?.querySelectorAll<HTMLButtonElement>("[data-row]");
        if (!items || items.length === 0) return;
        const active = document.activeElement as HTMLElement | null;
        const idx = Array.from(items).indexOf(active as HTMLButtonElement);
        let next = idx;
        if (e.key === "ArrowDown") next = Math.min(items.length - 1, idx + 1);
        if (e.key === "ArrowUp") next = Math.max(0, idx - 1);
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = items.length - 1;
        if (next !== idx && items[next]) {
          e.preventDefault();
          items[next].focus();
        }
      }}
    >
      {providers.map((p) => (
        <li key={p.id} role="option" aria-selected={selectedId === p.id} data-id={p.id}>
          <button
            type="button"
            data-row
            onClick={() => onSelect(p)}
            className={`row-hover flex w-full items-start gap-3 border-b border-[var(--color-line)] px-3 py-3 text-left transition-colors ${
              selectedId === p.id ? "bg-[var(--color-primary-soft)]" : "bg-white"
            }`}
          >
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]`}>
              <TypeIcon type={p.type} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[15px] font-semibold text-[var(--color-text)]">
                {p.name}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
                <span className="truncate">{p.region || p.country}</span>
                {p.hasDental && (
                  <span className="rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-medium text-emerald-700">
                    {t("dental")}
                  </span>
                )}
              </span>
            </span>
            {hasUserLocation && p.distance !== undefined && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-[var(--color-text)]">
                {formatDistance(p.distance, t("metersAbbr"), t("kmAbbr"))}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
