"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginAction,
  registerAction,
  updateProfileAction,
  updateLocationAction,
  getStoresAction,
} from "../lib/actions";

export interface User {
  id: number;
  name: string;
  lastname: string;
  dni: string | null;
  phone: string | null;
  email: string;
  avatarUrl: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  purchaseStreak: number;
  isVerified: boolean;
}

export interface Store {
  id: number;
  name: string;
  category: string;
  rating: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  distanceKm: number;
  lat: number;
  lng: number;
  address: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  location: string | null;
  coordinates: { lat: number; lng: number } | null;
  stores: Store[];
  nearestStores: Store[];
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, name?: string, lastname?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; lastname: string; email: string; password?: string; dni?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name: string; lastname: string; dni: string; phone: string; email: string }) => Promise<{ success: boolean; error?: string }>;
  updateLocation: (address: string, lat: number, lng: number) => Promise<{ success: boolean; error?: string }>;
  refreshStores: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Fórmula de Haversine para calcular distancia en km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [nearestStores, setNearestStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Cargar sesión guardada y tiendas
  useEffect(() => {
    async function init() {
      try {
        const resStores = await getStoresAction();
        if (resStores.success && resStores.stores) {
          setStores(resStores.stores as Store[]);
        }

        const savedEmail = localStorage.getItem("smart_stock_user_email");
        if (savedEmail) {
          const resUser = await loginAction(savedEmail);
          if (resUser.success && resUser.user) {
            const u = resUser.user as User;
            setUser(u);
            if (u.location && u.lat && u.lng) {
              setLocation(u.location);
              setCoordinates({ lat: u.lat, lng: u.lng });
            }
          }
        }
      } catch (err) {
        console.error("Error al iniciar contexto de usuario:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Calcular tiendas cercanas cada vez que cambian las coordenadas o las tiendas
  useEffect(() => {
    if (coordinates && stores.length > 0) {
      const computed = stores.map((store) => {
        const dist = getDistance(coordinates.lat, coordinates.lng, store.lat, store.lng);
        // Calcular tiempo proporcional a la distancia (aprox 15 min por cada km + 5 min base)
        const timeMin = Math.max(5, Math.round(dist * 15 + 5));
        const timeMax = timeMin + 5;
        return {
          ...store,
          distanceKm: parseFloat(dist.toFixed(1)),
          deliveryTimeMin: timeMin,
          deliveryTimeMax: timeMax,
        };
      });

      // Ordenar por distancia
      const sorted = [...computed].sort((a, b) => a.distanceKm - b.distanceKm);
      setNearestStores(sorted);

      // Si no hay tienda seleccionada o la seleccionada ya no es la más cercana,
      // establecer por defecto la más cercana si está a menos de 5km
      if (sorted.length > 0) {
        setSelectedStore(sorted[0]);
      }
    } else {
      setNearestStores([]);
      setSelectedStore(null);
    }
  }, [coordinates, stores]);

  const refreshStores = async () => {
    const resStores = await getStoresAction();
    if (resStores.success && resStores.stores) {
      setStores(resStores.stores as Store[]);
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    const res = await loginAction(email, password);
    if (res.success && res.user) {
      const u = res.user as User;
      setUser(u);
      localStorage.setItem("smart_stock_user_email", u.email);
      if (u.location && u.lat && u.lng) {
        setLocation(u.location);
        setCoordinates({ lat: u.lat, lng: u.lng });
      } else {
        setLocation(null);
        setCoordinates(null);
      }
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error };
  };

  const loginWithGoogle = async (email: string, _name?: string, _lastname?: string) => {
    setLoading(true);
    const res = await loginAction(email);
    if (res.success && res.user) {
      const u = res.user as User;
      setUser(u);
      localStorage.setItem("smart_stock_user_email", u.email);
      if (u.location && u.lat && u.lng) {
        setLocation(u.location);
        setCoordinates({ lat: u.lat, lng: u.lng });
      } else {
        setLocation(null);
        setCoordinates(null);
      }
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error };
  };

  const signup = async (data: {
    name: string;
    lastname: string;
    email: string;
    password?: string;
    dni?: string;
    phone?: string;
  }) => {
    setLoading(true);
    const res = await registerAction(data);
    if (res.success && res.user) {
      const u = res.user as User;
      setUser(u);
      localStorage.setItem("smart_stock_user_email", u.email);
      setLocation(null);
      setCoordinates(null);
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error };
  };

  const logout = () => {
    setUser(null);
    setLocation(null);
    setCoordinates(null);
    setSelectedStore(null);
    localStorage.removeItem("smart_stock_user_email");
  };

  const updateProfile = async (data: {
    name: string;
    lastname: string;
    dni: string;
    phone: string;
    email: string;
  }) => {
    if (!user) return { success: false, error: "No hay sesión iniciada." };
    const res = await updateProfileAction(user.id, data);
    if (res.success && res.user) {
      const u = res.user as User;
      setUser(u);
      localStorage.setItem("smart_stock_user_email", u.email);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const updateLocation = async (address: string, lat: number, lng: number) => {
    if (!user) return { success: false, error: "No hay sesión iniciada." };
    const res = await updateLocationAction(user.id, address, lat, lng);
    if (res.success && res.user) {
      const u = res.user as User;
      setUser(u);
      setLocation(address);
      setCoordinates({ lat, lng });
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        location,
        coordinates,
        stores,
        nearestStores,
        selectedStore,
        setSelectedStore,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateProfile,
        updateLocation,
        refreshStores,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser debe ser usado dentro de un UserProvider");
  }
  return context;
};
