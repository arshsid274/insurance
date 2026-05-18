export function formatPhone(e164: string | null): string {
  if (!e164) return "";
  // Cosmetic formatting for UAE: +971 4 123 4567
  if (e164.startsWith("+971") && e164.length >= 12) {
    const rest = e164.slice(4);
    return `+971 ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4)}`;
  }
  if (e164.startsWith("+965")) {
    const rest = e164.slice(4);
    return `+965 ${rest.slice(0, 4)} ${rest.slice(4)}`;
  }
  return e164;
}

export function telHref(e164: string | null): string | null {
  return e164 ? `tel:${e164}` : null;
}
