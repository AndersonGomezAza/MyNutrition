import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyNutrition",
    short_name: "MyNutrition",
    description:
      "Catálogo de supermercado, checklist de compras, plan de comidas y seguimiento de peso.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#059669",
    icons: [
      { src: "/api/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/api/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/api/icons/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
