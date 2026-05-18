export function isApplePlatform(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  if (!ua) return false;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Macintosh — distinguish via maxTouchPoints
  if (/Macintosh/.test(ua)) return true;
  return false;
}

export function buildNavigateUrl(lat: number, lng: number, label?: string): string {
  const safeLabel = label ? encodeURIComponent(label) : "";
  if (isApplePlatform()) {
    const q = safeLabel ? `&q=${safeLabel}` : "";
    return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d${q}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
