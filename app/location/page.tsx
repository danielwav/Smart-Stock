"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useUser, type Store } from "../../context/UserContext";
import { MapPin, Navigation, Gift, HelpCircle, Star, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Cargar InteractiveMap dinámicamente para evitar errores de SSR en Next.js
const InteractiveMap = dynamic(() => import("../../components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] bg-purple-50/50 rounded-2xl flex items-center justify-center border border-purple-100 shadow-md">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
        <span className="text-xs text-brand-purple font-semibold">Cargando mapa interactivo...</span>
      </div>
    </div>
  ),
});

export default function LocationPage() {
  const router = useRouter();
  const {
    user,
    location,
    coordinates,
    nearestStores,
    selectedStore,
    setSelectedStore,
    updateLocation,
    loading: userLoading,
  } = useUser();

  const [addressInput, setAddressInput] = useState("");
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [overpassTambos, setOverpassTambos] = useState<Store[]>([]);

  const combinedStores = useMemo(() => {
    if (overpassTambos.length === 0) return nearestStores;
    const dbIds = new Set(nearestStores.map((s) => s.id));
    const uniqueOverpass = overpassTambos.filter((o: any) => !dbIds.has(o.id));
    return [...nearestStores, ...uniqueOverpass];
  }, [nearestStores, overpassTambos]);

  // Redirigir si no hay sesión iniciada
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [user, userLoading, router]);

  // Sincronizar input con ubicación actual del usuario
  useEffect(() => {
    if (location) {
      setAddressInput(location);
    }
  }, [location]);

  // Geocodificación manual mediante Nominatim (OpenStreetMap)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setGeocodingLoading(true);
    setErrorMessage("");

    try {
      // Buscar dirección en Perú para mayor precisión
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressInput
        )}&countrycodes=pe&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        // Formatear dirección para que no sea excesivamente larga
        const shortAddress = display_name.split(",").slice(0, 3).join(",").trim();

        await updateLocation(shortAddress, newLat, newLng);
      } else {
        setErrorMessage("No pudimos encontrar esa dirección. Intenta con otra calle o número.");
      }
    } catch (err) {
      console.error(err);
      // Simulación en caso de error de red
      const mockLat = -11.9902 + (Math.random() - 0.5) * 0.02;
      const mockLng = -77.0812 + (Math.random() - 0.5) * 0.02;
      await updateLocation(addressInput, mockLat, mockLng);
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Geolocalización en vivo
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("La geolocalización no está soportada por tu navegador.");
      return;
    }

    setGeocodingLoading(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Obtener dirección textual (Reverse Geocoding)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const display_name = data.display_name || "";
          const shortAddress = display_name.split(",").slice(0, 3).join(",").trim() || 
            `Mi Ubicación (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

          await updateLocation(shortAddress, latitude, longitude);
        } catch (err) {
          // Fallback a coordenadas si falla la geocodificación reversa
          await updateLocation(
            `Av. Las Palmeras 3822, Los Olivos (Simulada)`,
            latitude,
            longitude
          );
        } finally {
          setGeocodingLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setErrorMessage("Permiso denegado o error al obtener la ubicación actual.");
        setGeocodingLoading(false);
        // Cargar ubicación de fallback simulada para desarrollo fluido
        updateLocation("Av. Las Palmeras 3822, Los Olivos", -11.9902, -77.0812);
      },
      { timeout: 10000 }
    );
  };

  // Click en el mapa
  const handleMapClick = async (lat: number, lng: number) => {
    setGeocodingLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const display_name = data.display_name || "";
      const shortAddress = display_name.split(",").slice(0, 3).join(",").trim() || 
        `Punto en el mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      await updateLocation(shortAddress, lat, lng);
    } catch (err) {
      await updateLocation(`Calle de la zona (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng);
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedStore) {
      router.push("/store");
    } else {
      setErrorMessage("Por favor, selecciona una bodega cercana para continuar.");
    }
  };

  if (userLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-neutral-bg">
        <div className="w-10 h-10 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-bg select-none">
      {/* Header específico de la página de localización */}
      <header className="w-full bg-white shadow-sm border-b border-purple-100/60 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-purple-500 flex items-center justify-center text-white shadow-md shadow-purple-200">
            <span className="font-bold text-base">S</span>
          </div>
          <span className="font-black text-xl tracking-tight text-brand-purple">
            SmartStock
          </span>
        </Link>
        <button className="p-2 rounded-full hover:bg-purple-50 text-gray-400 hover:text-brand-purple transition-all">
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
        
        {/* Sección: Bodegas Cercanas */}
        {(coordinates && combinedStores.length > 0) && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-brand-purple-dark uppercase tracking-wider">
                Bodegas cercanas
              </h2>
              {overpassTambos.length > 0 && (
                <span className="text-[9px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-full">
                  Incluye Tambos de la zona
                </span>
              )}
            </div>
            
            {/* Lista de Bodegas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {combinedStores.slice(0, 4).map((store) => {
                const isSelected = selectedStore?.id === store.id;
                const isOverpass = (store as any).isFromOverpass === true;
                return (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className={`flex items-center gap-4 bg-white border ${
                      isSelected
                        ? "border-brand-purple ring-2 ring-brand-purple/10 bg-purple-50/15"
                        : "border-purple-100 hover:border-brand-purple/50"
                    } p-4 rounded-3xl transition-all text-left shadow-sm hover:shadow-md cursor-pointer`}
                  >
                    {/* Imagen placeholder */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-purple-50">
                      <div className={`w-full h-full flex flex-col items-center justify-center p-2 font-black text-[9px] leading-tight ${isOverpass ? "bg-blue-100 text-blue-700" : "bg-yellow-400 text-brand-purple-dark"}`}>
                        <span className={`px-1 py-0.5 rounded text-[8px] text-white ${isOverpass ? "bg-blue-500" : "bg-brand-purple"}`}>
                          {isOverpass ? "TAMBO+" : "TAMBO"}
                        </span>
                        <span className="mt-0.5">{store.name.replace(/^Tambo\s*/i, "").split("-")[0].trim()}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-brand-purple-dark text-sm truncate">
                          {store.name}
                        </h3>
                        {isOverpass && (
                          <span className="text-[8px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            Overpass
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {store.category}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold mt-2">
                        <span className="flex items-center gap-0.5 text-brand-yellow font-black">
                          <Star className="w-3.5 h-3.5 fill-brand-yellow text-brand-yellow" />
                          {store.rating.toFixed(1)}
                        </span>
                        <span>⏱ {store.deliveryTimeMin}-{store.deliveryTimeMax} MIN</span>
                        {store.distanceKm > 0 && <span>📍 {store.distanceKm} KM</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sección: Caja de Ubicación e Interactive Map */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Lado Izquierdo: Buscador de dirección y progresso gratis */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="bg-white border border-purple-50 rounded-3xl p-6 md:p-8 shadow-sm">
              <h1 className="text-3xl font-black text-brand-purple-dark leading-tight tracking-tight">
                ¿Dónde entregamos <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-pink-500">
                  hoy?
                </span>
              </h1>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                Ingresa tu dirección para descubrir las bodegas cerca de ti.
              </p>

              {/* Input Dirección */}
              <form onSubmit={handleSearch} className="mt-6 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Calle, número y ciudad..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    className="w-full bg-purple-50/30 text-xs pl-9 pr-3 py-3.5 rounded-2xl border border-purple-100 focus:border-brand-purple focus:outline-none transition-all placeholder-gray-400 text-gray-800"
                  />
                  <MapPin className="w-4 h-4 text-brand-purple absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={geocodingLoading || !addressInput.trim()}
                  className="bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-md shadow-purple-100 cursor-pointer flex items-center justify-center shrink-0 min-w-[80px]"
                >
                  {geocodingLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </button>
              </form>

              {/* Alerta de Error */}
              {errorMessage && (
                <p className="text-[10px] text-red-500 font-semibold mt-2">{errorMessage}</p>
              )}

              {/* Botón Geolocalización actual */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={geocodingLoading}
                className="mt-4 flex items-center gap-1.5 text-xs text-brand-purple hover:text-brand-purple-dark font-bold transition-all cursor-pointer bg-purple-50/50 hover:bg-purple-100/50 px-4 py-2.5 rounded-2xl w-full justify-center border border-purple-100/50"
              >
                <Navigation className="w-3.5 h-3.5 rotate-45" />
                Usar mi ubicación actual
              </button>

              {/* Botón Confirmar Bodega */}
              {selectedStore && (
                <button
                  onClick={handleConfirmLocation}
                  className="mt-6 w-full bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark text-xs font-black py-4 rounded-2xl shadow-lg shadow-yellow-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Comenzar a comprar en {selectedStore.name.split("-")[1].trim()}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Banner de Bienvenida: Bebida Gratis */}
            <div className="bg-gradient-to-tr from-purple-100 via-indigo-50 to-pink-50 border border-purple-100/60 rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 bg-brand-yellow rounded-2xl text-brand-purple-dark shadow-md shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-brand-purple-dark text-xs leading-snug">
                  ¿Nuevo Usuario?
                </h3>
                <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
                  Completa tu primera dirección y ¡desbloquea una bebida <span className="text-brand-purple font-black">GRATIS!</span>
                </p>
                <div className="mt-3.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mb-1">
                    <span>PROGRESO</span>
                    <span className="text-brand-purple font-black">50%</span>
                  </div>
                  <div className="w-full bg-purple-200/50 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-purple to-pink-500 h-full rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Mapa Interactivo */}
          <div className="md:col-span-7 flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              Explora tu zona
            </span>
            <div className="h-[380px] md:h-[460px]">
              <InteractiveMap
                userCoords={coordinates}
                onMapClick={handleMapClick}
                stores={combinedStores}
                selectedStore={selectedStore}
                onTambosFound={setOverpassTambos}
              />
            </div>
          </div>

        </div>

      </main>
      
      <Footer />
    </div>
  );
}
