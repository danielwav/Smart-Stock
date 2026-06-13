"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User as UserIcon, LogOut, Store as StoreIcon, Menu, X } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, location, selectedStore, logout } = useUser();
  const { cartCount, searchQuery, setSearchQuery } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  if (pathname === "/login" || pathname === "/") {
    return null;
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (pathname !== "/store") {
      router.push("/store");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const linkClass = (path: string) => {
    const isActive = pathname === path || (path !== "/store" && pathname === "/store" && new URLSearchParams(window.location.search).get("filter") === path.split("=")[1]);
    return `text-sm font-semibold tracking-wide transition-all px-3 py-1.5 rounded-full ${
      isActive
        ? "text-brand-purple bg-brand-purple-light"
        : "text-gray-500 hover:text-brand-purple hover:bg-purple-50/50"
    }`;
  };

  const navLinks = user && location ? (
    <>
      <Link href="/store" className={linkClass("/store")} onClick={() => setMobileMenuOpen(false)}>
        Tienda
      </Link>
      <Link href="/store?filter=promos" className={linkClass("/store?filter=promos")} onClick={() => setMobileMenuOpen(false)}>
        Promociones
      </Link>
      <Link href="/store?filter=combos" className={linkClass("/store?filter=combos")} onClick={() => setMobileMenuOpen(false)}>
        Combos
      </Link>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-purple-100/60">
      <div className="flex items-center justify-between px-3 md:px-8 py-3">
        {/* Left section: hamburger + logo */}
        <div className="flex items-center gap-2 md:gap-6">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-purple-50 text-gray-500 hover:text-brand-purple transition-all cursor-pointer"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href={user ? "/store" : "/login"} className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-purple-500 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <span className="font-bold text-base">S</span>
            </div>
            <span className="hidden sm:inline font-black text-xl tracking-tight text-brand-purple group-hover:opacity-95 transition-opacity">
              SmartStock
            </span>
          </Link>

          {user && location && (
            <nav className="hidden md:flex items-center gap-2">
              {navLinks}
            </nav>
          )}
        </div>

        {/* Right section: search + actions */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end max-w-2xl">
          {user && (
            <div className="relative w-full max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-md group">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-purple-50/50 hover:bg-purple-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400 pl-3 pr-8 py-2 rounded-full border border-purple-100 focus:border-brand-purple focus:outline-none transition-all focus:shadow-md focus:shadow-purple-50"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-purple transition-colors pointer-events-none" />
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {user && location && (
              <Link
                href="/location"
                title="Cambiar ubicación"
                className="hidden lg:flex items-center gap-1.5 text-xs text-brand-purple bg-brand-purple-light hover:bg-brand-purple/15 px-3 py-1.5 rounded-full transition-all border border-brand-purple/10 max-w-[160px]"
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span className="truncate font-semibold">
                  {selectedStore ? selectedStore.name : "Elegir tienda"}
                </span>
              </Link>
            )}

            {user && (
              <Link
                href="/cart"
                className={`p-2 rounded-full relative transition-all border ${
                  pathname === "/cart"
                    ? "bg-brand-purple-light border-brand-purple/20 text-brand-purple"
                    : "bg-purple-50/50 hover:bg-purple-100/50 border-purple-100 text-gray-600 hover:text-brand-purple"
                }`}
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-yellow text-brand-purple-dark text-[10px] font-black w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-scaleIn">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

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
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-brand-purple flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 hover:text-red-700 transition-all cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 md:w-5 md:h-5" />
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
      </div>

      {/* Mobile menu dropdown */}
      {user && location && mobileMenuOpen && (
        <div ref={menuRef} className="md:hidden border-t border-purple-100/60 bg-white shadow-lg animate-slideDown">
          <div className="px-4 py-3 flex flex-col gap-1">
            <Link
              href="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-600 hover:text-brand-purple hover:bg-purple-50 px-3 py-2.5 rounded-xl transition-all"
            >
              🏪 Tienda
            </Link>
            <Link
              href="/store?filter=promos"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-600 hover:text-brand-purple hover:bg-purple-50 px-3 py-2.5 rounded-xl transition-all"
            >
              🔥 Promociones
            </Link>
            <Link
              href="/store?filter=combos"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-600 hover:text-brand-purple hover:bg-purple-50 px-3 py-2.5 rounded-xl transition-all"
            >
              📦 Combos
            </Link>
            {selectedStore && (
              <div className="mt-2 pt-2 border-t border-purple-100/50 px-3 py-2 text-xs text-gray-400 font-medium">
                <span className="block truncate">📍 {selectedStore.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
