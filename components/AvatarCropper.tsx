"use client";

import React, { useState, useRef, useCallback } from "react";
import { RotateCw, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface AvatarCropperProps {
  image: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export const AvatarCropper: React.FC<AvatarCropperProps> = ({ image, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const size = 280;

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = e.currentTarget;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCrop({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyTransforms = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const imgSize = Math.min(img.naturalWidth, img.naturalHeight);
    const scale = (size * zoom) / imgSize;
    const dx = -img.naturalWidth / 2 + crop.x;
    const dy = -img.naturalHeight / 2 + crop.y;

    ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.restore();
  }, [rotation, flipH, flipV, zoom, crop, size]);

  React.useEffect(() => {
    if (imageRef.current) {
      imageRef.current.onload = () => applyTransforms();
    }
    applyTransforms();
  }, [rotation, flipH, flipV, zoom, crop, applyTransforms]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-purple-50 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-brand-purple-dark">Editar foto de perfil</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview del recorte */}
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-gray-900 flex items-center justify-center"
          style={{ height: size, maxWidth: size, margin: "0 auto" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={image}
            alt="Preview"
            className="hidden"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />
          <canvas ref={canvasRef} width={size} height={size} className="rounded-2xl" />
          <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none" />
        </div>

        {/* Controles */}
        <div className="mt-5 space-y-4">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-brand-purple h-1.5"
            />
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </div>

          {/* Rotar y Voltear */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setRotation((r) => r + 90)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl border border-purple-100 transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotar
            </button>
            <button
              onClick={() => setFlipH((f) => !f)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                flipH ? "bg-brand-purple-light text-brand-purple border-brand-purple" : "text-gray-500 bg-purple-50 hover:bg-purple-100 border-purple-100"
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Voltear H
            </button>
            <button
              onClick={() => setFlipV((f) => !f)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                flipV ? "bg-brand-purple-light text-brand-purple border-brand-purple" : "text-gray-500 bg-purple-50 hover:bg-purple-100 border-purple-100"
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              Voltear V
            </button>
          </div>
        </div>

        {/* Botones acción */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 py-3 rounded-2xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
