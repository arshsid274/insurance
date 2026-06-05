"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { Provider, ProviderType, UserLocation, GeolocationStatus } from "@/lib/types";
import { haversineKm } from "@/lib/distance";
import { DEFAULT_CENTER, queryPermission, requestLocation } from "@/lib/geolocation";
import SearchBar from "./SearchBar";
import FilterChips from "./FilterChips";
import ProviderList from "./ProviderList";
import ProviderCard from "./ProviderCard";
import LocationPrompt from "./LocationPrompt";
import PermissionDeniedModal from "./PermissionDeniedModal";
import MobileBottomSheet from "./MobileBottomSheet";
import LanguageSwitcher from "./LanguageSwitcher";
import { LocateFixed, MapPin } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#e8f4f3]" aria-busy="true">
      <p className="text-sm text-[var(--color-muted)]">…</p>
    </div>
  ),
});

const ALL_TYPES: ProviderType[] = [
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Diagnostics",
  "Day Surgery Center",
  "Optical Center",
];

export interface MedLocatorProps {
  initialProviders: Provider[];
}

export default function MedLocator({ initialProviders }: MedLocatorProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [includeAddress, setIncludeAddress] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<ProviderType>>(new Set(ALL_TYPES));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [center, setCenter] = useState<UserLocation>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(10);
  const [geoStatus, setGeoStatus] = useState<GeolocationStatus>("idle");
  const [showInitialPrompt, setShowInitialPrompt] = useState(true);
  const [showDeniedModal, setShowDeniedModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Type counts
  const typeCounts = useMemo(() => {
    const m = new Map<ProviderType, number>();
    for (const p of initialProviders) m.set(p.type, (m.get(p.type) ?? 0) + 1);
    return m;
  }, [initialProviders]);

  // Counts of providers
  const totalCount = initialProviders.length;

  // Filter + search + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: Array<Provider & { distance?: number }> = [];
    for (const p of initialProviders) {
      if (!activeTypes.has(p.type)) continue;
      if (q) {
        const hay = includeAddress
          ? `${p.name} ${p.region} ${p.address} ${p.group ?? ""}`.toLowerCase()
          : `${p.name} ${p.region} ${p.group ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const distance = userLocation ? haversineKm(userLocation, p) : undefined;
      results.push({ ...p, distance });
    }
    if (userLocation) results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    else results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, [initialProviders, activeTypes, query, userLocation, includeAddress]);

  const selected = useMemo(
    () => (selectedId ? filtered.find((p) => p.id === selectedId) ?? null : null),
    [filtered, selectedId],
  );

  const handleLocate = useCallback(async () => {
    setGeoStatus("prompting");
    setShowInitialPrompt(false);
    try {
      const loc = await requestLocation();
      setUserLocation(loc);
      setCenter(loc);
      setZoom(13);
      setGeoStatus("granted");
    } catch (err) {
      const e = err as { code: 1 | 2 | 3 };
      if (e.code === 1) {
        setGeoStatus("denied");
        setShowDeniedModal(true);
      } else if (e.code === 2) {
        setGeoStatus("unavailable");
      } else {
        setGeoStatus("timeout");
      }
    }
  }, []);

  const handleSkip = useCallback(() => {
    setShowInitialPrompt(false);
    setGeoStatus("idle");
  }, []);

  const handleRetry = useCallback(async () => {
    const state = await queryPermission();
    if (state === "denied") {
      setShowDeniedModal(true);
      return;
    }
    void handleLocate();
  }, [handleLocate]);

  const toggleType = useCallback((t: ProviderType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActiveTypes(new Set(ALL_TYPES));
    setQuery("");
  }, []);

  const handleSelectProvider = useCallback(
    (p: Provider) => {
      setSelectedId(p.id);
      setCenter({ lat: p.lat, lng: p.lng });
      setZoom(Math.max(15, zoom));
    },
    [zoom],
  );

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--color-bg)]">
      <a
        href="#main"
        className="absolute start-2 top-2 z-[10000] -translate-y-20 rounded-md bg-white px-3 py-2 text-sm font-medium text-[var(--color-primary-deep)] shadow focus:translate-y-0"
      >
        {t("skipToList")}
      </a>
      {/* Top navbar */}
      <header className="absolute inset-x-3 top-3 z-[1500] flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.08)] backdrop-blur md:inset-x-4 md:top-4 md:gap-3">
        <div className="flex items-center gap-2 ps-1 pe-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-primary)] text-white">
            <MapPin className="h-5 w-5" aria-hidden />
          </div>
          <div className="hidden sm:block">
            <p className="font-display text-base font-semibold leading-tight text-[var(--color-text)]">{t("appName")}</p>
            <p className="text-[11px] leading-tight text-[var(--color-muted)]">
              {t("providersCount", { n: totalCount.toLocaleString() })}
            </p>
          </div>
        </div>
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            includeAddress={includeAddress}
            onToggleIncludeAddress={() => setIncludeAddress((v) => !v)}
          />
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="btn-ghost !min-h-[40px] !rounded-xl !px-3"
          aria-label={userLocation ? t("updateLocation") : t("useLocation")}
          title={userLocation ? t("updateLocation") : t("useLocation")}
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">{userLocation ? t("updateLocation") : t("useLocation")}</span>
        </button>
        <LanguageSwitcher />
      </header>

      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          providers={filtered}
          center={center}
          zoom={zoom}
          userLocation={userLocation}
          selectedId={selectedId}
          onSelect={(p) => setSelectedId(p.id)}
        />
      </div>

      {/* Desktop side panel */}
      {!isMobile && (
        <aside className="absolute bottom-3 left-3 top-[88px] z-[1400] flex w-[360px] flex-col overflow-hidden rounded-2xl bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.10)] backdrop-blur md:bottom-4 md:left-4 md:top-[92px] lg:w-[380px]">
          <div className="border-b border-[var(--color-line)] px-3 py-3">
            <FilterChips counts={typeCounts} active={activeTypes} onToggle={toggleType} />
          </div>
          <div className="flex-1 overflow-hidden" id="main">
            <ProviderList
              providers={filtered}
              selectedId={selectedId}
              onSelect={handleSelectProvider}
              hasUserLocation={!!userLocation}
              onResetFilters={resetFilters}
            />
          </div>
          {selected && (
            <div className="border-t border-[var(--color-line)] bg-white p-3">
              <ProviderCard provider={selected} userLocation={userLocation} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </aside>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          providers={filtered}
          selected={selected}
          selectedId={selectedId}
          counts={typeCounts}
          active={activeTypes}
          userLocation={userLocation}
          onToggleType={toggleType}
          onSelect={handleSelectProvider}
          onCloseCard={() => setSelectedId(null)}
          onResetFilters={resetFilters}
        />
      )}

      {/* Initial geolocation prompt */}
      {showInitialPrompt && (
        <LocationPrompt onAccept={handleLocate} onSkip={handleSkip} status={geoStatus} />
      )}

      {/* Permission denied modal */}
      {showDeniedModal && (
        <PermissionDeniedModal onClose={() => setShowDeniedModal(false)} />
      )}
    </div>
  );
}
