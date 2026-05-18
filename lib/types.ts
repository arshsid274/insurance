export type ProviderType =
  | "Hospital"
  | "Clinic"
  | "Pharmacy"
  | "Diagnostics"
  | "Day Surgery Center"
  | "Optical Center";

export interface Provider {
  id: number;
  name: string;
  type: ProviderType;
  country: string;
  region: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  hasDental: boolean;
  group: string | null;
  networks: string[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type GeolocationStatus =
  | "idle"
  | "prompting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout";
