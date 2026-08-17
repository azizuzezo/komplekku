import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Komplekku",
    short_name: "Komplekku",
    description: "Informasi dan layanan lingkungan dalam satu tempat.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4B2DA1",
    lang: "id-ID",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/komplekku-mark.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
