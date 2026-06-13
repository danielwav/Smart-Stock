"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { useCart } from "../../context/CartContext";
import { getProductsAction, createOrderAction, updateOrderStatusAction } from "../../lib/actions";
import { Product as DBProduct } from "@prisma/client";
import {
  Trash2,
  Minus,
  Plus,
  Lock,
  ArrowLeft,
  CreditCard,
  Calendar,
  User as UserIcon,
  CheckCircle,
  Store,
  AlertCircle,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ImagePlaceholder from "../../components/ImagePlaceholder";

export default function CartPage() {
  const router = useRouter();
  const { user, location, selectedStore, loading: userLoading } = useUser();
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    cartTotal,
    amountNeededForFreeProduct,
    freeProductProgress,
    addToCart,
    removeFromCart,
    deleteFromCart,
    clearCart,
    updateQuantity,
  } = useCart();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [upsellProducts, setUpsellProducts] = useState<DBProduct[]>([]);
  
  // Estados de Pasarela de Pagos
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"visa" | "mastercard" | "yape" | "plin" | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  
  // Estados de Procesamiento y Éxito
  const [checkoutStep, setCheckoutStep] = useState<"form" | "processing" | "success">("form");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [pickupStep, setPickupStep] = useState(0); // 0: Pendiente, 1: Preparando, 2: Listo para recoger, 3: Recogido
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.replace("/login");
      } else if (!location) {
        router.replace("/location");
      }
    }
  }, [user, location, userLoading, router]);

  // Cargar productos para venta cruzada ("Más para tu combo")
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getProductsAction();
        if (res.success && res.products) {
          const dbProds = res.products as DBProduct[];
          setProducts(dbProds);
          
          // Recomendar productos que NO estén en el carrito actualmente
          // y que pertenezcan a las marcas indicadas en la Imagen 4 bottom:
          // Papas Inka Chips, Agua San Mateo Personal, Piqueos Cuisine, Yogurt Gloria Frutado
          const targets = ["inka chips", "san mateo personal", "piqueos", "frutado"];
          const filtered = dbProds.filter((p) => {
            const inCart = cartItems.some((item) => item.product.id === p.id);
            const matchesTarget = targets.some((t) => p.name.toLowerCase().includes(t));
            return !inCart && matchesTarget;
          });
          setUpsellProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProducts();
  }, [cartItems]);

  // Algoritmo de Luhn para validación de tarjeta
  const validateLuhn = (num: string) => {
    const clean = num.replace(/\s+/g, "").replace(/\D/g, "");
    if (clean.length < 13 || clean.length > 19) return false;
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCardForm = () => {
    const errs: Record<string, string> = {};
    
    // Validar Número de Tarjeta
    const cleanCardNum = cardNumber.replace(/\s+/g, "");
    if (!cleanCardNum) {
      errs.cardNumber = "Número de tarjeta requerido.";
    } else if (cleanCardNum.length < 16) {
      errs.cardNumber = "Debe tener 16 dígitos.";
    } else if (!validateLuhn(cleanCardNum)) {
      errs.cardNumber = "Número de tarjeta inválido (falla validación de Luhn).";
    }

    // Validar Vencimiento MM/YY
    const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expiry) {
      errs.expiry = "Fecha de vencimiento requerida.";
    } else if (!expiryRegex.test(expiry)) {
      errs.expiry = "Formato MM/YY inválido.";
    } else {
      const parts = expiry.split("/");
      const month = parseInt(parts[0], 10);
      const year = parseInt("20" + parts[1], 10);
      const now = new Date();
      const curMonth = now.getMonth() + 1;
      const curYear = now.getFullYear();
      if (year < curYear || (year === curYear && month < curMonth)) {
        errs.expiry = "La tarjeta está vencida.";
      }
    }

    // Validar CVV
    if (!cvv) {
      errs.cvv = "CVV requerido.";
    } else if (cvv.length < 3 || cvv.length > 4) {
      errs.cvv = "Debe tener 3 o 4 dígitos.";
    }

    // Validar Nombre del Titular
    if (!cardName.trim()) {
      errs.cardName = "Nombre del titular requerido.";
    }

    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Procesamiento del Pago Seguro Simuladamente
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCardForm()) return;

    setCheckoutStep("processing");
    
    // Simular retraso de procesamiento del banco (3 segundos)
    setTimeout(async () => {
      try {
        if (!user) return;
        
        // Registrar orden en la base de datos MySQL
        const itemsToSave = cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        }));
        
        const storeName = selectedStore?.name || "Recojo en tienda";
        const res = await createOrderAction(
          user.id,
          cartTotal,
          storeName,
          itemsToSave
        );

        if (res.success && res.order) {
          setCreatedOrder(res.order);
          setCheckoutStep("success");
          clearCart();

          const orderId = res.order.id;
          const statuses = ["Pendiente", "Preparando", "Listo para recoger", "Recogido"];
          let step = 0;

          const interval = setInterval(() => {
            step += 1;
            setPickupStep(step);
            if (step <= 3) {
              updateOrderStatusAction(orderId, statuses[step]);
            }
            if (step >= 3) {
              clearInterval(interval);
            }
          }, 3500);
        } else {
          setCardErrors({ form: res.error || "Error al procesar la orden en base de datos." });
          setCheckoutStep("form");
        }
      } catch (err) {
        setCardErrors({ form: "Error de red al procesar el pago." });
        setCheckoutStep("form");
      }
    }, 3000);
  };

  // Formatear input de tarjeta (espacios cada 4 dígitos)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  // Formatear input de expiración (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2);
    }
    setExpiry(value);
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
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col gap-10">
        
        {/* Enlace para volver a la tienda */}
        <div className="flex items-center">
          <button
            onClick={() => router.push("/store")}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-purple hover:text-brand-purple-dark transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Tienda
          </button>
        </div>

        {cartItems.length === 0 && !showCheckout ? (
          <div className="w-full bg-white rounded-3xl border border-purple-100 p-16 text-center shadow-sm">
            <h2 className="text-2xl font-black text-brand-purple-dark">Tu carrito está vacío</h2>
            <p className="text-sm text-gray-400 mt-2">¡Explora la tienda y agrega algunos productos!</p>
            <button
              onClick={() => router.push("/store")}
              className="mt-6 bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-purple-100 cursor-pointer"
            >
              Ir a comprar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Lado Izquierdo: Listado de Productos en Carrito (Imagen 4 Izquierda) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex items-center justify-between pl-1">
                <h1 className="text-2xl font-black text-brand-purple-dark tracking-tight">
                  Tu Carrito
                </h1>
                <span className="text-xs font-bold text-gray-400">
                  ({cartCount} {cartCount === 1 ? "producto" : "productos"} seleccionados)
                </span>
              </div>

              {/* Lista de productos */}
              <div className="flex flex-col gap-4">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white border border-purple-100/80 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm"
                  >
                    {/* Imagen Placeholder */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <ImagePlaceholder
                        filename={`${item.product.imageKey}.jpg`}
                        description={item.product.name}
                        type="product"
                        className="w-full h-full"
                      />
                    </div>

                    {/* Detalles */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <span className="text-[8px] font-black uppercase text-brand-purple bg-brand-purple-light px-2 py-0.5 rounded-md">
                        {item.product.category}
                      </span>
                      <h3 className="font-bold text-brand-purple-dark text-sm mt-1 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">
                        {item.product.unit}
                      </p>
                    </div>

                    {/* Selector de cantidad y precio (Imagen 4) */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex items-center bg-purple-50/50 rounded-xl border border-purple-100/50 p-1">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 hover:bg-purple-100 rounded-lg text-brand-purple transition-all cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black px-3.5 text-brand-purple-dark">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item.product.id as any)}
                          className="p-1 hover:bg-purple-100 rounded-lg text-brand-purple transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal por ítem */}
                      <span className="font-black text-brand-purple-dark text-sm min-w-[70px] text-right">
                        S/ {(item.product.price * item.quantity).toFixed(2)}
                      </span>

                      {/* Botón borrar */}
                      <button
                        onClick={() => deleteFromCart(item.product.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 hover:text-red-700 transition-all border border-red-100/50 cursor-pointer"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado Derecho: Resumen Lateral (Imagen 4 Derecha) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white border border-purple-50 rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-black text-brand-purple-dark mb-6">
                  Resumen
                </h2>
                
                {/* Costos */}
                <div className="space-y-3 pb-6 border-b border-purple-50">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                    <span>Subtotal</span>
                    <span>S/ {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-brand-purple-dark pt-1">
                    <span>Total</span>
                    <span className="text-xl text-brand-purple">S/ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Barra incentivo para bebida gratis (Imagen 4) */}
                <div className="my-6 bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                  {amountNeededForFreeProduct > 0 ? (
                    <>
                      <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mb-1 leading-none">
                        <span>¡CASI LLEGAS A UN PRODUCTO GRATIS!</span>
                        <span className="text-brand-purple font-black">
                          S/ {amountNeededForFreeProduct.toFixed(2)} faltan
                        </span>
                      </div>
                      <div className="w-full bg-purple-200/50 h-2.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-gradient-to-r from-brand-purple to-pink-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${freeProductProgress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <span className="text-[10px] font-black text-brand-purple bg-brand-purple-light px-3 py-1 rounded-full uppercase tracking-wider">
                        🎁 ¡Desbloqueaste tu bebida gratis!
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón Pagar Ahora */}
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark text-xs font-black py-4 rounded-2xl shadow-lg shadow-yellow-100 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.01]"
                >
                  Pagar Ahora
                </button>

                {/* Sello de seguridad */}
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold mt-4">
                  <Lock className="w-3.5 h-3.5 text-gray-300" />
                  Pago 100% Seguro
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Más para tu combo (Imagen 4 inferior) */}
        {!showCheckout && upsellProducts.length > 0 && (
          <div className="w-full mt-4">
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h2 className="text-sm font-black text-brand-purple-dark uppercase tracking-wider">
                  Más para tu combo
                </h2>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Complementa tu orden
                </p>
              </div>
              <button className="text-xs font-bold text-brand-purple hover:underline cursor-pointer">
                Ver todo
              </button>
            </div>

            {/* Grid de productos cruzados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {upsellProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-purple-100/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
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
                      <h4 className="font-bold text-brand-purple-dark text-xs truncate group-hover:text-brand-purple transition-colors">
                        {prod.name}
                      </h4>
                      <span className="font-black text-brand-purple-dark text-xs mt-1.5 block">
                        S/ {prod.price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(prod as any)}
                      className="mt-3 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark p-2 rounded-xl shadow-sm cursor-pointer self-end transform hover:scale-105 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL PASARELA DE PAGOS E HILO DE ENVÍO */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-50 p-6 md:p-8 animate-scaleIn">
            
            {/* 1. Formulario de Pago */}
            {checkoutStep === "form" && (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-purple-50 mb-6">
                  <h3 className="text-lg font-black text-brand-purple-dark flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-purple" />
                    Pasarela de Pagos (Demostración)
                  </h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-xs font-bold text-gray-400 hover:text-brand-purple cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                {cardErrors.form && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {cardErrors.form}
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-brand-purple-dark mb-3 uppercase tracking-wider">
                    Selecciona un método de pago
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("visa")}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === "visa"
                          ? "border-brand-purple bg-brand-purple-light text-brand-purple ring-2 ring-brand-purple/10"
                          : "border-purple-100 bg-white text-gray-500 hover:border-brand-purple/50"
                      }`}
                    >
                      <svg className="w-7 h-5" viewBox="0 0 24 16">
                        <rect width="24" height="16" rx="2" fill="#1A1F71" />
                        <text x="5" y="11" fill="white" fontSize="6" fontWeight="bold">VISA</text>
                      </svg>
                      Visa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mastercard")}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === "mastercard"
                          ? "border-brand-purple bg-brand-purple-light text-brand-purple ring-2 ring-brand-purple/10"
                          : "border-purple-100 bg-white text-gray-500 hover:border-brand-purple/50"
                      }`}
                    >
                      <svg className="w-7 h-5" viewBox="0 0 24 16">
                        <rect width="24" height="16" rx="2" fill="#F79E1B" />
                        <circle cx="9" cy="8" r="5" fill="#EB001B" />
                        <circle cx="15" cy="8" r="5" fill="#F79E1B" opacity="0.8" />
                      </svg>
                      Mastercard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("yape")}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === "yape"
                          ? "border-brand-purple bg-brand-purple-light text-brand-purple ring-2 ring-brand-purple/10"
                          : "border-purple-100 bg-white text-gray-500 hover:border-brand-purple/50"
                      }`}
                    >
                      <div className="w-7 h-5 rounded bg-[#6A39AF] flex items-center justify-center text-white text-[8px] font-black">Y</div>
                      Yape
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("plin")}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === "plin"
                          ? "border-brand-purple bg-brand-purple-light text-brand-purple ring-2 ring-brand-purple/10"
                          : "border-purple-100 bg-white text-gray-500 hover:border-brand-purple/50"
                      }`}
                    >
                      <div className="w-7 h-5 rounded bg-[#FF3B3B] flex items-center justify-center text-white text-[8px] font-black">P</div>
                      Plin
                    </button>
                  </div>
                </div>

                {paymentMethod && (paymentMethod === "visa" || paymentMethod === "mastercard") && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {/* Campo: Nombre del Titular */}
                    <div>
                      <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                        Titular de la Tarjeta
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Alex Rivera"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className={`w-full bg-purple-50/30 text-xs pl-9 pr-3 py-3 rounded-xl border ${
                            cardErrors.cardName ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                          } focus:outline-none focus:bg-white transition-all`}
                        />
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {cardErrors.cardName && (
                        <p className="text-[10px] text-red-500 mt-1 font-semibold">{cardErrors.cardName}</p>
                      )}
                    </div>

                    {/* Campo: Número de Tarjeta */}
                    <div>
                      <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                        Número de Tarjeta
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="4556 1234 5678 9012"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className={`w-full bg-purple-50/30 text-xs pl-9 pr-3 py-3 rounded-xl border ${
                            cardErrors.cardNumber ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                          } focus:outline-none focus:bg-white transition-all`}
                        />
                        <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {cardErrors.cardNumber && (
                        <p className="text-[10px] text-red-500 mt-1 font-semibold">{cardErrors.cardNumber}</p>
                      )}
                    </div>

                    {/* Campos: Expiración y CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                          Vencimiento
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={handleExpiryChange}
                            className={`w-full bg-purple-50/30 text-xs pl-9 pr-3 py-3 rounded-xl border ${
                              cardErrors.expiry ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                            } focus:outline-none focus:bg-white transition-all`}
                          />
                          <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {cardErrors.expiry && (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold">{cardErrors.expiry}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                          CVV
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="•••"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                            className={`w-full bg-purple-50/30 text-xs pl-9 pr-3 py-3 rounded-xl border ${
                              cardErrors.cvv ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                            } focus:outline-none focus:bg-white transition-all`}
                          />
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {cardErrors.cvv && (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    {/* Botón Pagar */}
                    <button
                      type="submit"
                      className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-100 transition-all cursor-pointer mt-4 flex items-center justify-center gap-2"
                    >
                      Confirmar Pago de S/ {cartTotal.toFixed(2)}
                    </button>
                  </form>
                )}

                {paymentMethod && (paymentMethod === "yape" || paymentMethod === "plin") && (
                  <div className="space-y-4">
                    <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100/50 text-center">
                      <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center shadow-md mb-3">
                        {paymentMethod === "yape" ? (
                          <span className="text-2xl font-black text-[#6A39AF]">Y</span>
                        ) : (
                          <span className="text-2xl font-black text-[#FF3B3B]">P</span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-brand-purple-dark">
                        Paga con {paymentMethod === "yape" ? "Yape" : "Plin"}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Escanea el código QR con tu app de {paymentMethod === "yape" ? "Yape" : "Plin"} para pagar.
                      </p>
                      {/* QR Placeholder */}
                      <div className="w-36 h-36 bg-white mx-auto mt-4 rounded-2xl border-2 border-dashed border-purple-200 flex items-center justify-center shadow-inner">
                        <div className="text-center">
                          <div className="grid grid-cols-5 gap-0.5 w-24 h-24 mx-auto">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-sm ${
                                  [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24].includes(i)
                                    ? "bg-brand-purple-dark"
                                    : "bg-white"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[8px] text-gray-300 font-semibold mt-1 block">QR Demo</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCheckoutStep("processing");
                        setTimeout(async () => {
                          try {
                            if (!user) return;
                            const itemsToSave = cartItems.map((item) => ({
                              productId: item.product.id,
                              quantity: item.quantity,
                              price: item.product.price,
                            }));
                            const storeName = selectedStore?.name || "Recojo en tienda";
                            const res = await createOrderAction(
                              user.id,
                              cartTotal,
                              storeName,
                              itemsToSave
                            );
                            if (res.success && res.order) {
                              setCreatedOrder(res.order);
                              setCheckoutStep("success");
                              clearCart();
                              const orderId = res.order.id;
                              const statuses = ["Pendiente", "Preparando", "Listo para recoger", "Recogido"];
                              let step = 0;
                              const interval = setInterval(() => {
                                step += 1;
                                setPickupStep(step);
                                if (step <= 3) {
                                  updateOrderStatusAction(orderId, statuses[step]);
                                }
                                if (step >= 3) {
                                  clearInterval(interval);
                                }
                              }, 3500);
                            } else {
                              setCardErrors({ form: res.error || "Error al procesar la orden." });
                              setCheckoutStep("form");
                            }
                          } catch (err) {
                            setCardErrors({ form: "Error de red al procesar el pago." });
                            setCheckoutStep("form");
                          }
                        }, 2000);
                      }}
                      className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      Pagar S/ {cartTotal.toFixed(2)} con {paymentMethod === "yape" ? "Yape" : "Plin"}
                    </button>
                  </div>
                )}

                {!paymentMethod && (
                  <p className="text-[10px] text-gray-400 text-center font-semibold">
                    Selecciona un método de pago para continuar
                  </p>
                )}
              </div>
            )}

            {/* 2. Pantalla de Procesamiento */}
            {checkoutStep === "processing" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
                  <Lock className="w-6 h-6 text-brand-purple absolute" />
                </div>
                <h3 className="text-lg font-black text-brand-purple-dark mt-6">
                  Procesando Pago Seguro
                </h3>
                <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                  Estamos validando tus credenciales de pago de forma encriptada. Por favor, no cierres esta ventana.
                </p>
              </div>
            )}

            {/* 3. Pantalla de Compra Exitosa y Seguimiento */}
            {checkoutStep === "success" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto animate-scaleIn">
                    <CheckCircle className="w-8 h-8 fill-green-100" />
                  </div>
                  <h3 className="text-xl font-black text-brand-purple-dark mt-4">
                    ¡Compra Completada!
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Tu pedido ha sido recibido y ya se está preparando.
                  </p>
                </div>

                {/* Resumen de orden simulada */}
                <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100/50 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-brand-purple-dark">
                    <span>Código de Pedido:</span>
                    <span className="font-mono text-[10px] uppercase">
                      {createdOrder?.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Total Pagado:</span>
                    <span className="font-bold text-brand-purple">S/ {createdOrder?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-start justify-between text-gray-500 gap-4">
                    <span className="shrink-0">Recojo en:</span>
                    <span className="font-semibold text-right truncate max-w-[200px]" title={createdOrder?.address}>
                      {createdOrder?.address || "Tienda seleccionada"}
                    </span>
                  </div>
                </div>

                {/* Estado de Recojo en Tienda */}
                <div className="border-t border-purple-50 pt-6">
                  <h4 className="text-xs font-bold text-brand-purple-dark uppercase tracking-wider mb-5 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-brand-purple" />
                    Estado de Recojo
                  </h4>

                  {/* Barra de progreso de recojo */}
                  <div className="relative flex justify-between items-center max-w-sm mx-auto px-4">
                    
                    {/* Línea conectora */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 bg-purple-100 h-1 z-0">
                      <div
                        className="bg-brand-purple h-full transition-all duration-1000"
                        style={{ width: `${(pickupStep / 3) * 100}%` }}
                      />
                    </div>

                    {/* Pasos */}
                    {[
                      { label: "Pendiente", step: 0 },
                      { label: "Preparando", step: 1 },
                      { label: "Listo", step: 2 },
                      { label: "Recogido", step: 3 },
                    ].map((s) => {
                      const active = pickupStep >= s.step;
                      const current = pickupStep === s.step;
                      return (
                        <div key={s.label} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                              current
                                ? "bg-brand-purple border-white ring-4 ring-brand-purple/20 text-white scale-125"
                                : active
                                ? "bg-brand-purple border-brand-purple text-white"
                                : "bg-white border-purple-100 text-gray-300"
                            }`}
                          >
                            {s.step + 1}
                          </div>
                          <span
                            className={`text-[9px] font-bold mt-2.5 ${
                              active ? "text-brand-purple font-black" : "text-gray-400"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}

                  </div>

                  {/* Mensaje dinámico de estado */}
                  <div className="mt-6 text-center text-xs text-gray-400 font-semibold leading-relaxed">
                    {pickupStep === 0 && "Hemos recibido tu orden. Pronto empezaremos a prepararla."}
                    {pickupStep === 1 && "La tienda está preparando los productos de tu carrito."}
                    {pickupStep === 2 && "¡Tu pedido está listo! Pasa a recogerlo a la tienda."}
                    {pickupStep === 3 && "¡Pedido recogido con éxito! Que disfrutes tus productos."}
                  </div>
                </div>

                {/* Botón cerrar */}
                {pickupStep === 3 && (
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setPickupStep(0);
                      router.push("/store");
                    }}
                    className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold py-3.5 rounded-2xl shadow-md transition-all cursor-pointer animate-pulse"
                  >
                    Volver a la Tienda
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
