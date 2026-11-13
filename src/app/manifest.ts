import type { MetadataRoute } from "next";

// Values preserved from the original Base44 manifest.json; icons now self-hosted.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StratScope",
    short_name: "StratScope",
    description:
      "A premium digital publication providing deep-dive analysis and technical intelligence on global defence systems, military technology, and strategic geopolitical trends.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff",
    icons: [{ src: "/images/migrated/fe95762a2_logo.jpg", sizes: "1024x1024", type: "image/jpeg" }],
  };
}
