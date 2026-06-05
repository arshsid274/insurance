"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { Provider, UserLocation } from "@/lib/types";
import { TypeIcon, pinClass } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";
import { getVectorStyle, getRasterFallback, localeToMapLang } from "@/lib/tiles";

type Props = {
  providers: (Provider & { distance?: number })[];
  center: UserLocation;
  zoom: number;
  userLocation: UserLocation | null;
  selectedId: number | null;
  onSelect: (p: Provider) => void;
};

function buildPinHtml(type: Provider["type"]): string {
  const svg = renderToStaticMarkup(<TypeIcon type={type} className="h-4 w-4" />);
  return `<div class="${pinClass(type)}">${svg}</div>`;
}

const ICON_CACHE = new Map<string, L.DivIcon>();
function getIcon(type: Provider["type"], selected: boolean): L.DivIcon {
  const key = `${type}|${selected ? 1 : 0}`;
  const cached = ICON_CACHE.get(key);
  if (cached) return cached;
  const html = buildPinHtml(type).replace('class="pin', selected ? 'class="pin pin--selected ' : 'class="pin');
  const icon = L.divIcon({
    html,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -28],
  });
  ICON_CACHE.set(key, icon);
  return icon;
}

const USER_ICON = L.divIcon({
  html: '<div class="user-dot"></div>',
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Rewrites every symbol layer's text-field to prefer `name:<lang>` and fall back
 * through Latin transliteration and the default `name` field. Called on locale
 * change. Idempotent.
 */
function applyMapLanguage(mlMap: maplibregl.Map, lang: string) {
  if (!mlMap.isStyleLoaded()) return;
  const layers = mlMap.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    const layout = (layer as { layout?: Record<string, unknown> }).layout;
    if (!layout || !("text-field" in layout)) continue;
    try {
      mlMap.setLayoutProperty(layer.id, "text-field", [
        "coalesce",
        ["get", `name:${lang}`],
        ["get", "name:latin"],
        ["get", "name_int"],
        ["get", "name"],
      ]);
    } catch {
      // Skip layers that don't accept this expression
    }
  }
}

export default function MapView({
  providers,
  center,
  zoom,
  userLocation,
  selectedId,
  onSelect,
}: Props) {
  const { locale } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vectorLayerRef = useRef<L.Layer | null>(null);
  const mlMapRef = useRef<maplibregl.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markerById = useRef<Map<number, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: !reduce,
      zoomAnimation: !reduce,
    });

    // Try MapLibre vector layer first — supports runtime language switching.
    let attachedVector = false;
    const vec = getVectorStyle();
    if (vec) {
      try {
        const gl = (L as unknown as {
          maplibreGL: (opts: {
            style: string | maplibregl.StyleSpecification;
            attribution: string;
          }) => L.Layer & { getMaplibreMap: () => maplibregl.Map };
        }).maplibreGL({
          style: vec.styleUrl,
          attribution: vec.attribution,
        });
        gl.addTo(map);
        const ml = gl.getMaplibreMap();
        mlMapRef.current = ml;
        vectorLayerRef.current = gl;
        attachedVector = true;

        const apply = () => applyMapLanguage(ml, localeToMapLang(locale));
        // Fire when style + glyphs are ready
        if (ml.isStyleLoaded()) apply();
        else ml.once("style.load", apply);
        ml.on("styledata", apply);
      } catch (err) {
        console.warn("[MapView] MapLibre init failed, falling back to OSM raster", err);
      }
    }

    if (!attachedVector) {
      const r = getRasterFallback();
      L.tileLayer(r.url, {
        maxZoom: r.maxZoom,
        attribution: r.attribution,
        subdomains: r.subdomains ?? "abc",
      }).addTo(map);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    map.addLayer(cluster);

    mapRef.current = map;
    clusterRef.current = cluster;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      vectorLayerRef.current = null;
      mlMapRef.current = null;
      markerById.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch language on the running MapLibre instance
  useEffect(() => {
    const ml = mlMapRef.current;
    if (!ml) return;
    const lang = localeToMapLang(locale);
    if (ml.isStyleLoaded()) applyMapLanguage(ml, lang);
    else ml.once("style.load", () => applyMapLanguage(ml, lang));
  }, [locale]);

  // Rebuild markers when filtered providers change
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();
    markerById.current.clear();
    const batch: L.Marker[] = [];
    for (const p of providers) {
      const m = L.marker([p.lat, p.lng], {
        icon: getIcon(p.type, false),
        title: p.name,
        alt: p.name,
        keyboard: true,
      });
      m.on("click", () => onSelectRef.current(p));
      batch.push(m);
      markerById.current.set(p.id, m);
    }
    cluster.addLayers(batch);
  }, [providers]);

  // Pan/zoom on center change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      map.setView([center.lat, center.lng], zoom, { animate: false });
    } else {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.7, easeLinearity: 0.25 });
    }
  }, [center.lat, center.lng, zoom]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (!userLocation) return;
    const m = L.marker([userLocation.lat, userLocation.lng], {
      icon: USER_ICON,
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    });
    m.addTo(map);
    userMarkerRef.current = m;
  }, [userLocation]);

  // Update selected icon
  useEffect(() => {
    for (const [id, marker] of markerById.current.entries()) {
      const p = providers.find((x) => x.id === id);
      if (!p) continue;
      marker.setIcon(getIcon(p.type, id === selectedId));
      marker.setZIndexOffset(id === selectedId ? 500 : 0);
    }
  }, [selectedId, providers]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Provider map" />;
}
