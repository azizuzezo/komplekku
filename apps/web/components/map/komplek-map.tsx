"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { MapPin } from "lucide-react";

const CENTER_LAT = -6.509706886903904;
const CENTER_LNG = 106.77295885896154;

const BOUNDARY_COORDS: Array<[number, number]> = [
  [-6.5082, 106.7728], // North entrance at Jl. Raya Bilabong Permai
  [-6.5086, 106.7742], // NE curve near Kios Bilabong Blok E
  [-6.51, 106.7745], // East along Jalan Kyai Haji Achmad Syahyani
  [-6.5112, 106.774], // SE corner
  [-6.5115, 106.7728], // South along Jl. Merpati
  [-6.511, 106.7715], // SW corner
  [-6.5097, 106.7714], // West along Blk. F2 / Jl. Kacer
  [-6.5085, 106.772], // NW curve
];

export function KomplekMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Map with EXACT requested Center Coordinates: -6.509706886903904, 106.77295885896154
      const map = L.map(mapContainerRef.current, {
        center: [CENTER_LAT, CENTER_LNG],
        zoom: 17,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // Tile layers (Streets vs Satellite)
      const tileUrl =
        mapStyle === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        attribution:
          mapStyle === "satellite"
            ? "Esri, Maxar, Earthstar Geographics"
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Draw Billabong Blok F Perimeter Boundary Ring
      const polygon = L.polygon(BOUNDARY_COORDS, {
        color: "#4B2DA1",
        weight: 3,
        dashArray: "6, 6",
        fillColor: "#4B2DA1",
        fillOpacity: 0.15,
      }).addTo(map);

      polygon.bindTooltip("Wilayah Billabong Blok F", { permanent: false });
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, mapStyle]);

  return (
    <div className="komplek-map-card card p-5 mb-5 border-border shadow-sm bg-surface">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4 mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            <span>Peta Billabong Blok F</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Peta wilayah perumahan Billabong Blok F (GPS {-6.509707}, {106.772959})
          </p>
        </div>

        {/* View Switcher: Streets vs Satellite */}
        <div className="flex items-center bg-surface-soft p-1 rounded-lg border border-border text-xs">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${mapStyle === "streets" ? "bg-surface font-semibold text-primary shadow-xs" : "text-text-secondary"}`}
            onClick={() => setMapStyle("streets")}
          >
            Peta Jalan
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${mapStyle === "satellite" ? "bg-surface font-semibold text-primary shadow-xs" : "text-text-secondary"}`}
            onClick={() => setMapStyle("satellite")}
          >
            Satelit
          </button>
        </div>
      </div>

      {/* Clean Leaflet Cartographic Map Canvas */}
      <div className="relative bg-surface-soft border border-border rounded-xl overflow-hidden min-h-[420px]">
        {isMounted ? (
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-10" />
        ) : (
          <div className="w-full h-full min-h-[420px] flex items-center justify-center text-text-secondary text-xs">
            Memuat Peta Billabong Blok F...
          </div>
        )}
      </div>
    </div>
  );
}
