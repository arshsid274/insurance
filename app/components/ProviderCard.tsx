"use client";

import { useEffect, useState } from "react";
import type { Provider, UserLocation } from "@/lib/types";
import { haversineKm, formatDistance } from "@/lib/distance";
import { buildNavigateUrl } from "@/lib/navigate";
import { formatPhone, telHref } from "@/lib/phone";
import { TypeIcon, Navigation, Phone, X } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";

export default function ProviderCard({
  provider,
  userLocation,
  onClose,
}: {
  provider: Provider;
  userLocation: UserLocation | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [navUrl, setNavUrl] = useState<string>(() => buildNavigateUrl(provider.lat, provider.lng, provider.name));
  useEffect(() => {
    setNavUrl(buildNavigateUrl(provider.lat, provider.lng, provider.name));
  }, [provider]);

  const dist = userLocation
    ? formatDistance(haversineKm(userLocation, provider), t("metersAbbr"), t("kmAbbr"))
    : null;
  const phoneHref = telHref(provider.phone);
  const phonePretty = formatPhone(provider.phone);

  return (
    <article
      aria-label={`${provider.name} details`}
      className="space-y-3"
    >
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]">
          <TypeIcon type={provider.type} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-semibold leading-tight text-[var(--color-text)]">
            {provider.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-[var(--color-text)]">{provider.type}</span>
            <span>{provider.region || provider.country}</span>
            {dist && <span>· {dist} {t("awaySuffix")}</span>}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("closeDetails")}
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {provider.address && (
        <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">
          {provider.address}
        </p>
      )}

      {provider.networks.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={t("networksLabel")}>
          {provider.networks.map((n) => (
            <span
              key={n}
              className="rounded-md bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-primary-deep)]"
            >
              {n}
            </span>
          ))}
          {provider.hasDental && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
              {t("dentalService")}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={navUrl}
          target="_blank"
          rel="noopener"
          className="btn-cta flex-1"
          aria-label={t("navigateAria", { name: provider.name })}
        >
          <Navigation className="h-4 w-4" />
          {t("navigate")}
        </a>
        {phoneHref && (
          <a href={phoneHref} className="btn-ghost flex-1" aria-label={t("callAria", { name: provider.name })}>
            <Phone className="h-4 w-4" />
            <span className="truncate">{phonePretty}</span>
          </a>
        )}
      </div>
    </article>
  );
}
