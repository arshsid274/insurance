import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MedLocator",
    short_name: "MedLocator",
    description: "Find in-network medical providers near you.",
    start_url: "/",
    display: "standalone",
    background_color: "#F0FDFA",
    theme_color: "#0891B2",
    orientation: "portrait",
    icons: [
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
