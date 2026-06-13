"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // No mostrar en la pantalla de login para que quede idéntica a la Imagen 0
  if (pathname === "/login" || pathname === "/") {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-purple-100/60 mt-auto py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Lado Izquierdo: Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <span className="font-bold text-sm text-brand-purple tracking-tight">SmartStock</span>
          <span className="text-[11px] text-gray-400 mt-1">
            © {currentYear} SmartStock. Bodega. Todos los derechos reservados.
          </span>
        </div>

        {/* Lado Derecho: Enlaces de navegación */}
        <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
          <Link href="#" className="hover:text-brand-purple transition-colors">
            Privacidad
          </Link>
          <Link href="#" className="hover:text-brand-purple transition-colors">
            Términos
          </Link>
          <Link href="#" className="hover:text-brand-purple transition-colors">
            Contacto
          </Link>
          <Link href="#" className="hover:text-brand-purple transition-colors">
            Ayuda
          </Link>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
