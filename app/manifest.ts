import type { MetadataRoute } from "next";

/** Makes Kairo installable as its own window, for example with Safari's "Add to Dock" (decision 022). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kairo",
    short_name: "Kairo",
    description: "Job search companion: track applications, get prepared, and act on the right opportunity in time.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
