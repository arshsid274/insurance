import {
  Cross,
  Stethoscope,
  Pill,
  Microscope,
  Scissors,
  Eye,
  MapPin,
  Search,
  Navigation,
  Phone,
  X,
  LocateFixed,
  TriangleAlert,
  ListFilter,
  Globe,
  Check,
} from "lucide-react";
import type { ProviderType } from "@/lib/types";

export function TypeIcon({ type, className }: { type: ProviderType; className?: string }) {
  const props = { className, "aria-hidden": true } as const;
  switch (type) {
    case "Hospital":
      return <Cross {...props} />;
    case "Clinic":
      return <Stethoscope {...props} />;
    case "Pharmacy":
      return <Pill {...props} />;
    case "Diagnostics":
      return <Microscope {...props} />;
    case "Day Surgery Center":
      return <Scissors {...props} />;
    case "Optical Center":
      return <Eye {...props} />;
  }
}

export function pinClass(type: ProviderType): string {
  switch (type) {
    case "Hospital":
      return "pin pin--Hospital";
    case "Clinic":
      return "pin pin--Clinic";
    case "Pharmacy":
      return "pin pin--Pharmacy";
    case "Diagnostics":
      return "pin pin--Diagnostics";
    case "Day Surgery Center":
      return "pin pin--Day";
    case "Optical Center":
      return "pin pin--Optical";
  }
}

export { MapPin, Search, Navigation, Phone, X, LocateFixed, TriangleAlert, ListFilter, Globe, Check };
