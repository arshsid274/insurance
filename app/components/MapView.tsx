"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { renderToStaticMarkup } from "react-dom/server";
import type { Provider, UserLocation } from "@/lib/types";
import { TypeIcon, pinClass } from "./icons";

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

function buildUserDotHtml(): string {
  return `<div class="user-dot"></div>`;
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
  html: buildUserDotHtml(),
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function MapView({
  providers,
  center,
  zoom,
  userLocation,
  selectedId,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
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
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false,
      fadeAnimation: !reduce,
      zoomAnimation: !reduce,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

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

    // Hard cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      markerById.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (id === selectedId) marker.setZIndexOffset(500);
      else marker.setZIndexOffset(0);
    }
  }, [selectedId, providers]);

  // Tile attribution control kept visible — required by OSM policy.

  return <div ref={containerRef} className="h-full w-full" aria-label="Provider map" />;
}
