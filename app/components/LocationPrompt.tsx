"use client";

import type { GeolocationStatus } from "@/lib/types";
import { LocateFixed, MapPin } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";

export default function LocationPrompt({
  onAccept,
  onSkip,
  status,
}: {
  onAccept: () => void;
  onSkip: () => void;
  status: GeolocationStatus;
}) {
  const { t } = useLanguage();
  const isPrompting = status === "prompting";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loc-title"
      className="fixed inset-0 z-[2000] grid place-items-center bg-[rgba(8,42,49,0.55)] p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]">
          <MapPin className="h-7 w-7" aria-hidden />
        </div>
        <h1 id="loc-title" className="mt-4 font-display text-[22px] font-semibold leading-tight text-[var(--color-text)]">
          {t("promptTitle")}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          {t("promptBody")}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={onAccept} className="btn-cta w-full" disabled={isPrompting}>
            <LocateFixed className="h-4 w-4" />
            {isPrompting ? t("locating") : t("useLocation")}
          </button>
          <button type="button" onClick={onSkip} className="btn-ghost w-full">
            {t("skipPrompt")}
          </button>
        </div>
      </div>
    </div>
  );
}
