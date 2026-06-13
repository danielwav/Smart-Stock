"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User as UserIcon, LogOut, Store as StoreIcon } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, location, selectedStore, logout } = useUser();
  const { cartCount, searchQuery, setSearchQuery } = useCart();

  // No mostrar Navbar en la pantalla de login/registro
  if (pathname === "/login" || pathname === "/") {
    // Si estamos en la raíz (página de bienvenida) y no hay sesión, no la mostramos.
    // Pero espera, ¿el usuario quiere que "/" sea la página de Login/Bienvenida o la Tienda?
    // En el plan, "/login" es la página de Imagen 0. Si no está logueado, lo mandamos a "/login".
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Si no estamos en la tienda y buscamos, redirigir a la tienda
    if (pathname !== "/store") {
      router.push("/store");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Determinar clase activa para los enlaces
  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `text-sm font-semibold tracking-wide transition-all px-3 py-1.5 rounded-full ${
      isActive
        ? "text-brand-purple bg-brand-purple-light"
        : "text-gray-500 hover:text-brand-purple hover:bg-purple-50/50"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-purple-100/60 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Sección Izquierda: Logo y Enlaces */}
      <div className="flex items-center gap-6 md:gap-8">
        <Link href={user ? "/store" : "/login"} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-purple-500 flex items-center justify-center text-white shadow-md shadow-purple-200">
            <span className="font-bold text-base">S</span>
          </div>
          <span className="font-black text-xl tracking-tight text-brand-purple group-hover:opacity-95 transition-opacity">
            SmartStock
          </span>
        </Link>

        {/* Links de navegación (ocultos si no está logueado/ubicado) */}
        {user && location && (
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/store" className={linkClass("/store")}>
              Tienda
            </Link>
            <Link href="/store?filter=promos" className={linkClass("/store?filter=promos")}>
              Promociones
            </Link>
            <Link href="/store?filter=combos" className={linkClass("/store?filter=combos")}>
              Combos
            </Link>
          </nav>
        )}
      </div>

      {/* Sección Central/Derecha: Búsqueda y Acciones */}
      <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end max-w-2xl">
        {/* Barra de búsqueda (solo si está logueado) */}
        {user && (
          <div className="relative w-full max-w-xs md:max-w-md group">
            <input
              type="text"
              placeholder="Buscar en la bodega..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-purple-50/50 hover:bg-purple-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400 pl-4 pr-10 py-2 rounded-full border border-purple-100 focus:border-brand-purple focus:outline-none transition-all focus:shadow-md focus:shadow-purple-50"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-purple transition-colors pointer-events-none" />
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Ubicación Actual indicator */}
          {user && location && (
            <Link
              href="/location"
              title="Cambiar ubicación"
              className="hidden lg:flex items-center gap-1.5 text-xs text-brand-purple bg-brand-purple-light hover:bg-brand-purple/15 px-3 py-1.5 rounded-full transition-all border border-brand-purple/10 max-w-[180px]"
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span className="truncate font-semibold">
                {selectedStore ? selectedStore.name : "Elegir tienda"}
              </span>
            </Link>
          )}

          {/* Carrito */}
          {user && (
            <Link
              href="/cart"
              className={`p-2 rounded-full relative transition-all border ${
                pathname === "/cart"
                  ? "bg-brand-purple-light border-brand-purple/20 text-brand-purple"
                  : "bg-purple-50/50 hover:bg-purple-100/50 border-purple-100 text-gray-600 hover:text-brand-purple"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-yellow text-brand-purple-dark text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-scaleIn">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Perfil / Sesión */}
          {user ? (
            <div className="flex items-center gap-1">
              <Link
                href="/profile"
                className={`p-0.5 rounded-full transition-all border ${
                  pathname === "/profile"
                    ? "bg-brand-purple-light border-brand-purple/20"
                    : "bg-purple-50/50 hover:bg-purple-100/50 border-purple-100"
                }`}
                title="Mi Perfil"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 hover:text-red-700 transition-all cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            pathname !== "/login" && (
              <Link
                href="/login"
                className="text-xs font-bold bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2 rounded-full transition-all shadow-md shadow-purple-100"
              >
                Iniciar Sesión
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
