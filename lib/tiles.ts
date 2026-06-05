import type { Locale } from "./i18n";

export interface VectorStyleConfig {
  styleUrl: string;
  attribution: string;
  provider: "maptiler" | "openfreemap";
}

export interface RasterTileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  provider: "osm";
}

const MT_ATTR =
  '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OFM_ATTR =
  '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Returns a MapLibre vector style URL. Vector styles let MapLibre render labels
 * client-side, so language switching is instant and free (no tile re-fetch).
 */
export function getVectorStyle(): VectorStyleConfig | null {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (key) {
    return {
      styleUrl: `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`,
      attribution: MT_ATTR,
      provider: "maptiler",
    };
  }
  return {
    styleUrl: "https://tiles.openfreemap.org/styles/liberty",
    attribution: OFM_ATTR,
    provider: "openfreemap",
  };
}

/** Last-resort raster fallback if MapLibre fails to init (e.g., no WebGL). */
export function getRasterFallback(): RasterTileConfig {
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM_ATTR,
    maxZoom: 19,
    subdomains: "abc",
    provider: "osm",
  };
}

/**
 * Standard ISO 639-1 codes that match the `name:xx` properties on OSM/MapTiler
 * vector tiles. We map our app locales to these codes — keep them in sync.
 */
export function localeToMapLang(locale: Locale): string {
  return locale; // en/ar/hi/ml are already valid name:xx codes
}
