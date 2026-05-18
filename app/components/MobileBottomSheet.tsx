"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import type { Provider, ProviderType, UserLocation } from "@/lib/types";
import FilterChips from "./FilterChips";
import ProviderList from "./ProviderList";
import ProviderCard from "./ProviderCard";

type ProviderWithDistance = Provider & { distance?: number };

export default function MobileBottomSheet({
  providers,
  selected,
  selectedId,
  counts,
  active,
  userLocation,
  onToggleType,
  onSelect,
  onCloseCard,
  onResetFilters,
}: {
  providers: ProviderWithDistance[];
  selected: ProviderWithDistance | null;
  selectedId: number | null;
  counts: Map<ProviderType, number>;
  active: Set<ProviderType>;
  userLocation: UserLocation | null;
  onToggleType: (t: ProviderType) => void;
  onSelect: (p: Provider) => void;
  onCloseCard: () => void;
  onResetFilters: () => void;
}) {
  const [open, setOpen] = useState(true);
  // Auto-expand a bit when a provider is selected
  const [snap, setSnap] = useState<number | string | null>(0.42);
  useEffect(() => {
    if (selected) setSnap(0.62);
  }, [selected]);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={setOpen}
      modal={false}
      snapPoints={[0.18, 0.42, 0.92]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-[1600] flex h-full max-h-[96dvh] flex-col rounded-t-3xl border-t border-[var(--color-line)] bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.18)] outline-none"
        >
          <Drawer.Title className="sr-only">Provider list</Drawer.Title>
          <Drawer.Description className="sr-only">
            Browse and search in-network medical providers near you.
          </Drawer.Description>
          <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-slate-300" aria-hidden />
          <div className="border-b border-[var(--color-line)] px-3 py-3">
            <FilterChips counts={counts} active={active} onToggle={onToggleType} />
          </div>
          {selected && (
            <div className="border-b border-[var(--color-line)] bg-white p-3">
              <ProviderCard provider={selected} userLocation={userLocation} onClose={onCloseCard} />
            </div>
          )}
          <div className="flex-1 overflow-hidden" id="main">
            <ProviderList
              providers={providers}
              selectedId={selectedId}
              onSelect={onSelect}
              hasUserLocation={!!userLocation}
              onResetFilters={onResetFilters}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
