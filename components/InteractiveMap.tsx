"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Store } from "../context/UserContext";
import { fetchNearbyTambosAction } from "../lib/actions";

interface InteractiveMapProps {
  userCoords: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  stores: Store[];
  selectedStore: Store | null;
  onTambosFound?: (tambos: Store[]) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userCoords,
  onMapClick,
  stores,
  selectedStore,
  onTambosFound,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkersRef = useRef<L.Marker[]>([]);
  const [searchingArea, setSearchingArea] = useState(false);

  const defaultLat = -11.9902;
  const defaultLng = -77.0812;

  const userIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-brand-purple/20 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-brand-purple border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
          Yo
        </div>
      </div>
    `,
    className: "custom-div-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const storeIcon = (isSelected: boolean, isOverpass: boolean = false) =>
    L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full ${
            isSelected
              ? "bg-brand-yellow border-2 border-brand-purple scale-125 z-30"
              : isOverpass
              ? "bg-blue-400 border-2 border-white scale-100"
              : "bg-white border-2 border-brand-purple scale-100 hover:scale-110"
          } shadow-md flex items-center justify-center transition-transform">
            <svg class="w-3.5 h-3.5 ${
              isSelected ? "text-brand-purple-dark font-black" : "text-brand-purple"
            }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      `,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

  const handleSearchArea = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    setSearchingArea(true);
    const center = map.getCenter();

    try {
      const res = await fetchNearbyTambosAction(center.lat, center.lng, 5000);
      if (res.success && res.tambos && res.tambos.length > 0 && onTambosFound) {
        onTambosFound(res.tambos as Store[]);
      }
    } catch (err) {
      console.error("Error searching area:", err);
    } finally {
      setSearchingArea(false);
    }
  }, [onTambosFound]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const startLat = userCoords?.lat || defaultLat;
    const startLng = userCoords?.lng || defaultLng;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    map.on("click", (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      fetchNearbyTambosAction(center.lat, center.lng, 5000).then((res) => {
        if (res.success && res.tambos && res.tambos.length > 0 && onTambosFound) {
          onTambosFound(res.tambos as Store[]);
        }
      }).catch(() => {});
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const lat = userCoords?.lat || defaultLat;
    const lng = userCoords?.lng || defaultLng;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon: userIcon, draggable: true })
        .addTo(map)
        .on("dragend", (e) => {
          const target = e.target as L.Marker;
          const pos = target.getLatLng();
          onMapClick(pos.lat, pos.lng);
        });
      userMarkerRef.current = marker;
    }

    if (userCoords) {
      map.setView([lat, lng], 15);
    }
  }, [userCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    storeMarkersRef.current.forEach((marker) => marker.remove());
    storeMarkersRef.current = [];

    const newMarkers = stores.map((store) => {
      const isSelected = selectedStore?.id === store.id;
      const isOverpass = (store as any).isFromOverpass === true;
      const marker = L.marker([store.lat, store.lng], {
        icon: storeIcon(isSelected, isOverpass),
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px;">
            <b style="color: #4c1d95; font-size: 13px;">${store.name}</b><br/>
            <span style="color: #6b7280;">${store.category}</span><br/>
            ${isOverpass ? '<span style="color: #3b82f6; font-weight: bold;">● Tambo real (OpenStreetMap)</span><br/>' : ""}
            <span style="color: #fbbf24; font-weight: bold;">★ ${store.rating}</span> • ${store.distanceKm || "?"} KM
          </div>
        `);

      if (isSelected) {
        marker.openPopup();
      }

      return marker;
    });

    storeMarkersRef.current = newMarkers;
  }, [stores, selectedStore]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-purple-100 shadow-md">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "320px" }} />

      {/* Button to search Tambos in current area */}
      <button
        onClick={handleSearchArea}
        disabled={searchingArea}
        className="absolute top-3 left-3 z-40 bg-white hover:bg-purple-50 text-brand-purple text-[10px] font-bold px-3 py-2 rounded-full shadow-lg border border-purple-100 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        title="Buscar Tambos en esta zona"
      >
        {searchingArea ? (
          <div className="w-3 h-3 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        {searchingArea ? "Buscando..." : "Buscar Tambos"}
      </button>

      {userCoords && (
        <button
          onClick={() => mapRef.current?.setView([userCoords.lat, userCoords.lng], 15)}
          className="absolute bottom-20 right-3.5 z-40 bg-white hover:bg-purple-50 text-brand-purple p-2.5 rounded-full shadow-lg border border-purple-100 cursor-pointer"
          title="Centrar en mi ubicación"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </button>
      )}
    </div>
  );
};
export default InteractiveMap;
