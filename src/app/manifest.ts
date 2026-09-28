import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pabulong - Second Brain & Boarding House Platform",
    short_name: "Pabulong",
    description:
      "Unified AI-powered Second Brain and student boarding house placement operating system with PostGIS geospatial search and pgvector intelligence.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#030712",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "education", "real-estate", "business"],
    shortcuts: [
      {
        name: "Placement Kanban",
        url: "/dashboard/placements",
        description: "Open active tenant candidate pipeline",
      },
      {
        name: "Second Brain",
        url: "/dashboard/notes",
        description: "Access semantic notes and vector memory",
      },
      {
        name: "Properties Directory",
        url: "/dashboard/properties",
        description: "Browse boarding houses and room availability",
      },
    ],
  };
}
