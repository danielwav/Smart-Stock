"use client";

import React from "react";
import { Image as ImageIcon, ShoppingBag, User, MapPin, CreditCard } from "lucide-react";

interface ImagePlaceholderProps {
  className?: string;
  filename: string;
  description: string;
  type?: "default" | "product" | "avatar" | "map" | "card" | "banner";
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  className = "",
  filename,
  description,
  type = "default",
}) => {
  // Elegir ícono según tipo
  const renderIcon = () => {
    switch (type) {
      case "product":
        return <ShoppingBag className="w-8 h-8 text-brand-purple/40" />;
      case "avatar":
        return <User className="w-10 h-10 text-brand-purple/40" />;
      case "map":
        return <MapPin className="w-10 h-10 text-brand-purple/40" />;
      case "card":
        return <CreditCard className="w-10 h-10 text-brand-purple/40" />;
      default:
        return <ImageIcon className="w-8 h-8 text-brand-purple/40" />;
    }
  };

  // Determinar clases según tipo para un diseño premium
  const getStyles = () => {
    switch (type) {
      case "avatar":
        return "rounded-full aspect-square border-2 border-brand-purple/20 bg-gradient-to-tr from-brand-purple-light to-purple-100 flex-col";
      case "banner":
        return "rounded-3xl border border-brand-purple/10 bg-gradient-to-r from-purple-100 via-indigo-50 to-pink-50 flex-col";
      default:
        return "rounded-2xl border-2 border-dashed border-purple-200/60 bg-purple-50/30 hover:bg-purple-50/50 transition-colors flex-col";
    }
  };

  return (
    <div
      className={`flex items-center justify-center text-center p-4 relative overflow-hidden group select-none ${getStyles()} ${className}`}
      title={`Reemplazar por public/images/${filename}`}
    >
      {/* Indicador de archivo de fondo */}
      <div className="absolute top-1 right-2 text-[9px] font-mono text-brand-purple/50 bg-brand-purple-light/80 px-1.5 py-0.5 rounded opacity-80 group-hover:opacity-100 transition-opacity">
        {filename}
      </div>

      <div className="flex flex-col items-center gap-2">
        {renderIcon()}
        <span className="text-xs font-semibold text-brand-purple/70 leading-tight">
          {description}
        </span>
        <span className="text-[9px] text-gray-400 font-mono select-all">
          /images/{filename}
        </span>
      </div>

      {/* Efecto de gradiente de brillo al pasar el mouse */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
    </div>
  );
};
export default ImagePlaceholder;
