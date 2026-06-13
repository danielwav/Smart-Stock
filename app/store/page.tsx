"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { useCart, type Product as CartProduct } from "../../context/CartContext";
import { getProductsAction, getComboProductsAction } from "../../lib/actions";
import { Product as DBProduct } from "@prisma/client";
import {
  Beer,
  Utensils,
  GlassWater,
  Flame,
  Wine,
  Megaphone,
  IceCream,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  ArrowLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ImagePlaceholder from "../../components/ImagePlaceholder";

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  textColor: string;
  icon: React.ReactNode;
}

type ViewMode = "default" | "bebidas" | "promos" | "combos";

function StoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const { user, location, loading: userLoading } = useUser();
  const { addToCart, addComboToCart, searchQuery } = useCart();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortByPrice, setSortByPrice] = useState<"asc" | "desc" | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [bebidasSubcategory, setBebidasSubcategory] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.replace("/login");
      } else if (!location) {
        router.replace("/location");
      }
    }
  }, [user, location, userLoading, router]);

  useEffect(() => {
    if (filterParam === "promos") {
      setViewMode("promos");
      setSelectedCategory(null);
    } else if (filterParam === "combos") {
      setViewMode("combos");
      setSelectedCategory(null);
    } else {
      setViewMode("default");
    }
  }, [filterParam]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getProductsAction();
        if (res.success && res.products) {
          setProducts(res.products as DBProduct[]);
        }
      } catch (err) {
        console.error("Error al cargar productos:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  const handleAddCombo = async (combo: DBProduct) => {
    try {
      const res = await getComboProductsAction(combo.id);
      if (res.success && res.items.length > 0) {
        addComboToCart(combo.id, res.items.map((i: any) => ({
          product: i.product as CartProduct,
          quantity: i.quantity,
        })), combo.name);
      } else {
        addToCart(combo as any);
      }
    } catch {
      addToCart(combo as any);
    }
  };

  const categories: CategoryItem[] = [
    { id: "Bebidas", name: "Bebidas", color: "bg-yellow-400 hover:bg-yellow-500", textColor: "text-yellow-800", icon: <GlassWater className="w-5 h-5" /> },
    { id: "Comida", name: "Comida", color: "bg-indigo-400 hover:bg-indigo-500", textColor: "text-indigo-800", icon: <Utensils className="w-5 h-5" /> },
    { id: "Tragos", name: "Tragos", color: "bg-pink-400 hover:bg-pink-500", textColor: "text-pink-800", icon: <Wine className="w-5 h-5" /> },
    { id: "Cigarros", name: "Cigarros", color: "bg-purple-300 hover:bg-purple-400", textColor: "text-purple-800", icon: <Flame className="w-5 h-5" /> },
    { id: "RTD", name: "RTD", color: "bg-red-400 hover:bg-red-500", textColor: "text-red-800", icon: <Beer className="w-5 h-5" /> },
    { id: "Promos", name: "Promos", color: "bg-rose-400 hover:bg-rose-500", textColor: "text-rose-800", icon: <Megaphone className="w-5 h-5" /> },
    { id: "Helados", name: "Helados", color: "bg-violet-400 hover:bg-violet-500", textColor: "text-violet-800", icon: <IceCream className="w-5 h-5" /> },
  ];

  const bebidasSubcategories = [
    { id: "Gaseosa", name: "Gaseosas", icon: "🥤" },
    { id: "Cerveza", name: "Cervezas", icon: "🍺" },
    { id: "Jugo", name: "Jugos", icon: "🧃" },
    { id: "Agua", name: "Agua", icon: "💧" },
  ];

  const getFilteredProducts = () => {
    let list = [...products];

    if (viewMode === "promos") {
      list = list.filter(
        (p) =>
          p.category === "Tragos" ||
          p.category === "Promos" ||
          p.isRecommended ||
          p.name.includes("2x1")
      );
      return list;
    }

    if (viewMode === "combos") {
      list = list.filter((p) => p.category === "Combo");
      return list;
    }

    if (viewMode === "bebidas") {
      list = list.filter((p) => p.category === "Bebidas");
      if (bebidasSubcategory) {
        list = list.filter((p) => p.subCategory === bebidasSubcategory);
      }
      list.sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.name.localeCompare(b.name);
      });
      return list;
    }

    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (sortByPrice === "asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortByPrice === "desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  };

  const handleCategoryClick = (catId: string) => {
    if (catId === "Bebidas") {
      setViewMode("bebidas");
      setBebidasSubcategory(null);
      setSelectedCategory(null);
      return;
    }
    setViewMode("default");
    if (selectedCategory === catId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catId);
    }
  };

  const toggleSortPrice = () => {
    if (sortByPrice === null) {
      setSortByPrice("asc");
    } else if (sortByPrice === "asc") {
      setSortByPrice("desc");
    } else {
      setSortByPrice(null);
    }
  };

  const allFiltered = getFilteredProducts();
  const recommendedProducts = allFiltered.filter((p) => p.isRecommended);

  if (userLoading || !user || !location) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-neutral-bg">
        <div className="w-10 h-10 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-bg select-none">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col gap-10">

        {/* ===== PASILLO DE BEBIDAS VIEW ===== */}
        {viewMode === "bebidas" && (
          <div className="w-full flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <button onClick={() => { setViewMode("default"); setSelectedCategory(null); }} className="hover:text-brand-purple cursor-pointer">Tienda</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-brand-purple font-bold">Pasillo de bebidas</span>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-2xl font-black text-brand-purple-dark">Pasillo de bebidas</h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {allFiltered.length > 0
                  ? `Mostrando ${allFiltered.length} ${allFiltered.length === 1 ? "producto" : "productos"}`
                  : "No hay productos en esta categoría"}
              </p>
            </div>

            {/* Subcategory Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {bebidasSubcategories.map((sub) => {
                const isActive = bebidasSubcategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setBebidasSubcategory(isActive ? null : sub.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-brand-purple text-white border-brand-purple shadow-md"
                        : "bg-white text-gray-600 border-purple-100 hover:border-brand-purple/50 hover:text-brand-purple"
                    }`}
                  >
                    <span>{sub.icon}</span>
                    {sub.name}
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="w-full py-16 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
              </div>
            ) : allFiltered.length === 0 ? (
              <div className="w-full bg-white rounded-3xl border border-purple-100 p-16 text-center">
                <p className="text-sm text-gray-400 font-semibold">
                  No encontramos productos en esta subcategoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allFiltered.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white border border-purple-100/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    {prod.stock <= 5 && (
                      <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-md animate-pulse">
                        Últimas existencias
                      </div>
                    )}
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-3">
                      <ImagePlaceholder
                        filename={`${prod.imageKey}.jpg`}
                        description={prod.name}
                        type="product"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {prod.subCategory && (
                          <span className="text-[7px] font-black uppercase text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded-md">
                            {prod.subCategory}
                          </span>
                        )}
                        <h3 className="font-bold text-brand-purple-dark text-xs truncate mt-1.5 group-hover:text-brand-purple transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                          {prod.unit}
                        </p>
                        {prod.stock > 0 && prod.stock > 5 && (
                          <p className="text-[8px] text-green-500 font-semibold mt-0.5">
                            Stock: {prod.stock}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-black text-brand-purple-dark text-xs">
                          S/ {prod.price.toFixed(2)}
                        </span>
                        {prod.stock > 0 ? (
                          <button
                            onClick={() => addToCart(prod as any)}
                            className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark p-1.5 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[8px] text-red-400 font-bold">Agotado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Purple promo box */}
            <div className="w-full bg-brand-purple rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-100 relative overflow-hidden mt-4">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full blur-2xl opacity-60" />
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-pink-500 rounded-full blur-3xl opacity-40" />
              <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg z-10">
                <h3 className="text-2xl md:text-3xl font-black leading-tight">
                  ¿Tienes sed de <span className="text-brand-yellow">ahorro</span>?
                </h3>
                <p className="text-sm text-purple-100 font-medium mt-3 leading-relaxed">
                  Usa tu tarjeta de SmartPoints y obtén descuento en tu segunda compra.
                </p>
              </div>
              <button
                onClick={() => router.push("/store?filter=promos")}
                className="z-10 bg-white hover:bg-purple-50 text-brand-purple-dark font-black text-xs px-6 py-3.5 rounded-full shadow-lg transition-all cursor-pointer hover:scale-105 shrink-0"
              >
                Ver promociones
              </button>
            </div>
          </div>
        )}

        {/* ===== PROMOCIONES VIEW ===== */}
        {viewMode === "promos" && (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <button onClick={() => { setViewMode("default"); router.push("/store"); }} className="hover:text-brand-purple cursor-pointer">Tienda</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-brand-purple font-bold">Promociones</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-brand-purple-dark">Promociones</h1>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  {allFiltered.length > 0
                    ? `${allFiltered.length} ${allFiltered.length === 1 ? "producto" : "productos"} en oferta`
                    : "No hay promociones disponibles"}
                </p>
              </div>
            </div>
            {loadingProducts ? (
              <div className="w-full py-16 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
              </div>
            ) : allFiltered.length === 0 ? (
              <div className="w-full bg-white rounded-3xl border border-purple-100 p-16 text-center">
                <p className="text-sm text-gray-400 font-semibold">No hay promociones disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allFiltered.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white border border-purple-100/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    {prod.isBestSeller && (
                      <div className="absolute top-2 left-2 z-10 bg-brand-yellow text-brand-purple-dark text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-md">
                        OFERTA
                      </div>
                    )}
                    {prod.stock <= 5 && (
                      <div className="absolute top-8 left-2 z-10 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-md animate-pulse">
                        Últimas existencias
                      </div>
                    )}
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-3">
                      <ImagePlaceholder
                        filename={`${prod.imageKey}.jpg`}
                        description={prod.name}
                        type="product"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase text-brand-purple bg-brand-purple-light px-1.5 py-0.5 rounded-md">
                          {prod.category}
                        </span>
                        <h3 className="font-bold text-brand-purple-dark text-xs truncate mt-1.5 group-hover:text-brand-purple transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                          {prod.unit}
                        </p>
                        {prod.stock > 0 && prod.stock > 5 && (
                          <p className="text-[8px] text-green-500 font-semibold mt-0.5">Stock: {prod.stock}</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-black text-brand-purple-dark text-xs">
                          S/ {prod.price.toFixed(2)}
                        </span>
                        {prod.stock > 0 ? (
                          <button
                            onClick={() => addToCart(prod as any)}
                            className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark p-1.5 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[8px] text-red-400 font-bold">Agotado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== COMBOS VIEW ===== */}
        {viewMode === "combos" && (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <button onClick={() => { setViewMode("default"); router.push("/store"); }} className="hover:text-brand-purple cursor-pointer">Tienda</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-brand-purple font-bold">Combos</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-brand-purple-dark">Combos especiales</h1>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  {allFiltered.length > 0
                    ? `${allFiltered.length} ${allFiltered.length === 1 ? "combo disponible" : "combos disponibles"}`
                    : "No hay combos disponibles"}
                </p>
              </div>
            </div>
            {loadingProducts ? (
              <div className="w-full py-16 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
              </div>
            ) : allFiltered.length === 0 ? (
              <div className="w-full bg-white rounded-3xl border border-purple-100 p-16 text-center">
                <p className="text-sm text-gray-400 font-semibold">No hay combos disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFiltered.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white border border-purple-100/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
                  >
                    {prod.isBestSeller && (
                      <div className="absolute top-0 right-0 bg-brand-yellow text-brand-purple-dark text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-bl-2xl shadow-sm">
                        Más vendido
                      </div>
                    )}
                    {prod.stock <= 5 && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider px-3 py-1.5 rounded-br-2xl shadow-sm animate-pulse">
                        Últimas existencias
                      </div>
                    )}
                    <div className="w-full h-44 rounded-2xl overflow-hidden mb-4">
                      <ImagePlaceholder
                        filename={`${prod.imageKey}.jpg`}
                        description={prod.name}
                        type="product"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-brand-purple-dark group-hover:text-brand-purple transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed line-clamp-2">
                          {prod.description}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-brand-purple-dark">
                            S/ {prod.price.toFixed(2)}
                          </span>
                          <p className="text-[9px] text-gray-400 font-semibold">{prod.unit}</p>
                        </div>
                        {prod.stock > 0 ? (
                          <button
                            onClick={() => handleAddCombo(prod)}
                            className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark text-xs font-black px-5 py-3 rounded-2xl shadow-md shadow-yellow-100 transition-all cursor-pointer hover:scale-105"
                          >
                            Agregar
                          </button>
                        ) : (
                          <span className="text-xs text-red-400 font-bold px-4 py-3">Agotado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Promo banner for combos */}
            <div className="w-full bg-gradient-to-r from-brand-purple-dark via-brand-purple to-purple-500 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden mt-2">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500 rounded-full blur-3xl opacity-40" />
              <div className="flex items-center gap-4 z-10">
                <Zap className="w-8 h-8 text-brand-yellow" />
                <div>
                  <h3 className="text-lg font-black">Combos que enamoran</h3>
                  <p className="text-sm text-purple-100 font-medium">Los mejores precios en packs seleccionados</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/store?filter=promos")}
                className="z-10 bg-white hover:bg-purple-50 text-brand-purple-dark font-black text-xs px-6 py-3 rounded-full shadow-lg transition-all cursor-pointer hover:scale-105 shrink-0"
              >
                Ver promociones
              </button>
            </div>
          </div>
        )}

        {/* ===== DEFAULT VIEW ===== */}
        {viewMode === "default" && (
          <>
            {/* Banner 2x1 en Bebidas */}
            <div className="w-full bg-brand-purple rounded-3xl p-6 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-100 relative overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full blur-2xl opacity-60" />
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-pink-500 rounded-full blur-3xl opacity-40" />

              <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg z-10">
                <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase">
                  Refresca tu <br className="hidden md:block" />
                  tarde con <span className="text-brand-yellow">2x1</span> <br className="hidden md:block" />
                  en Bebidas
                </h2>
                <p className="text-xs text-purple-100 font-medium mt-4 leading-relaxed max-w-sm">
                  Válido solo por hoy en toda la categoría de gaseosas y aguas. ¡Pide ahora!
                </p>
                <button
                  onClick={() => { setViewMode("bebidas"); setBebidasSubcategory(null); }}
                  className="mt-6 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark font-black text-xs px-6 py-3 rounded-full shadow-md shadow-yellow-500/10 transition-all cursor-pointer transform hover:scale-105"
                >
                  Comprar ahora
                </button>
              </div>

              <div className="w-full md:w-80 h-48 md:h-56 z-10 rounded-2xl overflow-hidden shrink-0">
                <ImagePlaceholder
                  filename="coca_cola_2x1_banner.jpg"
                  description="Banner publicitario Coca-Cola 2x1"
                  type="banner"
                  className="w-full h-full text-brand-purple"
                />
              </div>
            </div>

            {/* Pasillos Populares */}
            <div className="w-full">
              <h2 className="text-sm font-black text-brand-purple-dark uppercase tracking-wider mb-5 pl-1">
                Pasillos Populares
              </h2>
              <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="flex flex-col items-center gap-2 group snap-center cursor-pointer shrink-0"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-sm transition-all ${
                          isActive
                            ? "bg-brand-purple ring-4 ring-brand-purple/20 scale-110"
                            : `${cat.color} group-hover:scale-105`
                        }`}
                      >
                        {cat.icon}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isActive ? "text-brand-purple font-black" : "text-gray-400 group-hover:text-brand-purple"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recomendados para ti */}
            {!searchQuery && recommendedProducts.length > 0 && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-5 px-1">
                  <div>
                    <h2 className="text-sm font-black text-brand-purple-dark uppercase tracking-wider">
                      Recomendados para ti
                    </h2>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      Los favoritos de los clientes
                    </p>
                  </div>
                  <button className="text-xs font-bold text-brand-purple hover:underline cursor-pointer">
                    Ver todo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tarjeta Destacada Grande */}
                  {recommendedProducts.slice(0, 1).map((prod) => (
                    <div
                      key={prod.id}
                      className="md:col-span-2 bg-white border border-purple-100/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 items-center relative"
                    >
                      {prod.stock <= 5 && (
                        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-md animate-pulse">
                          Últimas existencias
                        </div>
                      )}
                      <div className="w-32 h-44 rounded-2xl overflow-hidden shrink-0">
                        <ImagePlaceholder
                          filename={`${prod.imageKey}.jpg`}
                          description={prod.name}
                          type="product"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between h-full py-2">
                        <div>
                          <span className="bg-brand-yellow text-brand-purple-dark text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            MÁS VENDIDO
                          </span>
                          <h3 className="text-xl font-black text-brand-purple-dark mt-2.5">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-gray-400 font-semibold mt-0.5">
                            {prod.description}
                          </p>
                          {prod.stock > 0 && prod.stock > 5 && (
                            <p className="text-[9px] text-green-500 font-semibold mt-1">Stock: {prod.stock}</p>
                          )}
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-4">
                          <span className="text-2xl font-black text-brand-purple-dark">
                            S/ {prod.price.toFixed(2)}
                          </span>
                          {prod.stock > 0 ? (
                            <button
                              onClick={() => addToCart(prod as any)}
                              className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark text-xs font-black px-6 py-3 rounded-2xl shadow-md shadow-yellow-100 transition-all cursor-pointer"
                            >
                              Agregar al Carrito
                            </button>
                          ) : (
                            <span className="text-xs text-red-400 font-bold px-4 py-3">Agotado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Tarjetas secundarias */}
                  <div className="flex flex-col gap-4">
                    {recommendedProducts.slice(1, 3).map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-purple-100/80 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative"
                      >
                        {prod.stock <= 5 && (
                          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[6px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                            Últimas existencias
                          </div>
                        )}
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <ImagePlaceholder
                            filename={`${prod.imageKey}.jpg`}
                            description={prod.name}
                            type="product"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-brand-purple-dark text-xs truncate">
                            {prod.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {prod.unit}
                          </p>
                          <span className="font-black text-brand-purple-dark text-xs mt-1.5 block">
                            S/ {prod.price.toFixed(2)}
                          </span>
                        </div>
                        {prod.stock > 0 ? (
                          <button
                            onClick={() => addToCart(prod as any)}
                            className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark p-2 rounded-xl shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Todos los Productos */}
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
                <h2 className="text-sm font-black text-brand-purple-dark uppercase tracking-wider">
                  {searchQuery ? `Resultados para "${searchQuery}"` : "Todos los Productos"}
                </h2>

                <div className="flex items-center gap-3 shrink-0">
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 cursor-pointer"
                    >
                      Limpiar filtro
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setSelectedCategory(selectedCategory ? null : "Bebidas")}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        selectedCategory
                          ? "bg-brand-purple text-white border-brand-purple"
                          : "bg-white text-gray-600 border-purple-100 hover:border-purple-200"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Filtrar
                    </button>
                  </div>

                  <button
                    onClick={toggleSortPrice}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      sortByPrice
                        ? "bg-brand-purple text-white border-brand-purple"
                        : "bg-white text-gray-600 border-purple-100 hover:border-purple-200"
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Precio {sortByPrice === "asc" ? "▲" : sortByPrice === "desc" ? "▼" : ""}
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="w-full py-16 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
                </div>
              ) : allFiltered.length === 0 ? (
                <div className="w-full bg-white rounded-3xl border border-purple-100 p-16 text-center">
                  <p className="text-sm text-gray-400 font-semibold">
                    No encontramos productos que coincidan con tu búsqueda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {allFiltered.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white border border-purple-100/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                    >
                      {prod.stock <= 5 && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-md animate-pulse">
                          Últimas existencias
                        </div>
                      )}
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3">
                        <ImagePlaceholder
                          filename={`${prod.imageKey}.jpg`}
                          description={prod.name}
                          type="product"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] font-black uppercase text-brand-purple bg-brand-purple-light px-1.5 py-0.5 rounded-md">
                            {prod.category}
                          </span>
                          <h3 className="font-bold text-brand-purple-dark text-xs truncate mt-1.5 group-hover:text-brand-purple transition-colors">
                            {prod.name}
                          </h3>
                          <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                            {prod.unit}
                          </p>
                          {prod.stock > 0 && prod.stock > 5 && (
                            <p className="text-[8px] text-green-500 font-semibold mt-0.5">
                              Stock: {prod.stock}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-black text-brand-purple-dark text-xs">
                            S/ {prod.price.toFixed(2)}
                          </span>
                          {prod.stock > 0 ? (
                            <button
                              onClick={() => addToCart(prod as any)}
                              className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark p-1.5 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[8px] text-red-400 font-bold">Agotado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center min-h-screen bg-neutral-bg">
        <div className="w-10 h-10 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    }>
      <StoreContent />
    </Suspense>
  );
}
