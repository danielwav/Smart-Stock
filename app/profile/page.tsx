"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { Camera, CheckCircle2, ShieldAlert, Award, Package, Store, Clock, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { getUserOrdersAction, updateAvatarAction } from "../../lib/actions";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import AvatarCropper from "../../components/AvatarCropper";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, loading: userLoading } = useUser();

  // Estados del formulario
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Estados de control
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Estados de pedidos
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Estados de avatar
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [user, userLoading, router]);

  // Cargar datos del usuario al formulario
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLastname(user.lastname || "");
      setDni(user.dni || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Cargar pedidos del usuario
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    getUserOrdersAction(user.id).then((res) => {
      if (res.success) setOrders(res.orders);
      setOrdersLoading(false);
    }).catch(() => setOrdersLoading(false));
  }, [user]);

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAvatarSave = async (blob: Blob) => {
    if (!user) return;
    setAvatarUploading(true);
    setShowCropper(false);
    try {
      const formData = new FormData();
      formData.append("file", blob, "avatar.png");
      const uploadRes = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);
      const res = await updateAvatarAction(user.id, uploadData.url);
      if (res.success && res.user) {
        const updated = { ...user, avatarUrl: uploadData.url };
        localStorage.setItem("smart_stock_user_email", updated.email);
        window.location.reload();
      }
    } catch (err) {
      console.error("Error al subir avatar:", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) newErrors.name = "El nombre es requerido.";
    if (!lastname.trim()) newErrors.lastname = "El apellido es requerido.";

    if (!email) {
      newErrors.email = "El correo electrónico es requerido.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Formato de correo electrónico inválido.";
    }

    if (dni && DNIError(dni)) {
      newErrors.dni = "DNI inválido (debe tener formato estándar o 8 caracteres).";
    }

    if (phone && phone.length < 9) {
      newErrors.phone = "El teléfono debe tener al menos 9 dígitos.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const DNIError = (val: string) => {
    // Acepta formato 8 dígitos o el formato con letra al final de referencia
    return val.length < 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const res = await updateProfile({
        name,
        lastname,
        dni,
        phone,
        email,
      });

      if (res.success) {
        setSuccessMessage("Cambios guardados con éxito.");
        // Ocultar mensaje tras 4 segundos
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrors({ form: res.error || "Ocurrió un error al guardar los cambios." });
      }
    } catch (err) {
      setErrors({ form: "Error de red al intentar actualizar el perfil." });
    } finally {
      setSubmitLoading(false);
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
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="text-3xl font-black text-brand-purple-dark leading-tight tracking-tight">
          Mi Perfil
        </h1>
        <p className="text-gray-400 text-xs mt-1">
          Gestiona tu identidad para la aplicación.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mt-8">
          
          {/* Tarjeta Izquierda: Avatar e Info de Racha (Imagen 2 Izquierda) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-purple-50 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              
              {/* Foto de Perfil / Placeholder */}
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-brand-yellow mt-4 group">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlaceholder
                    filename="user_avatar.jpg"
                    description="Foto de perfil del cliente"
                    type="avatar"
                    className="w-full h-full"
                  />
                )}
                
                {/* Botón overlay para editar foto */}
                <button
                  type="button"
                  onClick={handleAvatarSelect}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Cambiar foto de perfil"
                >
                  <div className="bg-brand-purple text-white p-2.5 rounded-full shadow-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                </button>
              </div>

              {/* File input oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Nombre y Rol */}
              <h2 className="text-xl font-black text-brand-purple-dark mt-5">
                {user.name} {user.lastname}
              </h2>
              <span className="text-[9px] font-black uppercase text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded-full tracking-widest mt-1.5">
                CLIENTE
              </span>

              {/* Racha de Compras */}
              <div className="w-full mt-6 bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-brand-purple" />
                    Racha de Compras
                  </span>
                  <span className="text-brand-purple font-black">{user.purchaseStreak}%</span>
                </div>
                
                <div className="w-full bg-purple-200/50 h-3 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-gradient-to-r from-brand-purple to-pink-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${user.purchaseStreak}%` }}
                  />
                </div>
                
                <p className="text-[9px] text-gray-400 font-semibold mt-3 text-left leading-normal">
                  {user.purchaseStreak >= 100
                    ? "¡Felicidades! Has desbloqueado tu cupón especial."
                    : `¡A solo ${Math.max(1, Math.ceil((100 - user.purchaseStreak) / 5))} pedidos del próximo cupón!`}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta Derecha: Formulario de Datos (Imagen 2 Derecha) */}
          <div className="md:col-span-8">
            <div className="bg-white border border-purple-50 rounded-3xl p-6 md:p-8 shadow-sm">
              
              {/* Alertas */}
              {errors.form && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 font-medium animate-scaleIn">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.form}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-2.5 text-xs text-green-700 font-medium animate-scaleIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nombre y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-purple-dark mb-2 uppercase tracking-wider">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-purple-50/30 text-xs px-4 py-3.5 rounded-2xl border ${
                        errors.name ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                      } focus:outline-none focus:bg-white transition-all`}
                    />
                    {errors.name && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-purple-dark mb-2 uppercase tracking-wider">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      className={`w-full bg-purple-50/30 text-xs px-4 py-3.5 rounded-2xl border ${
                        errors.lastname ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                      } focus:outline-none focus:bg-white transition-all`}
                    />
                    {errors.lastname && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.lastname}</p>}
                  </div>
                </div>

                {/* DNI y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-purple-dark mb-2 uppercase tracking-wider">
                      DNI
                    </label>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className={`w-full bg-purple-50/30 text-xs px-4 py-3.5 rounded-2xl border ${
                        errors.dni ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                      } focus:outline-none focus:bg-white transition-all`}
                    />
                    {errors.dni && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.dni}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-purple-dark mb-2 uppercase tracking-wider">
                      Número de Teléfono
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full bg-purple-50/30 text-xs px-4 py-3.5 rounded-2xl border ${
                        errors.phone ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                      } focus:outline-none focus:bg-white transition-all`}
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.phone}</p>}
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-bold text-brand-purple-dark mb-2 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-purple-50/30 text-xs px-4 py-3.5 rounded-2xl border ${
                      errors.email ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                    } focus:outline-none focus:bg-white transition-all`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.email}</p>}
                </div>

                {/* Footer del Formulario */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-purple-50">
                  {/* Cuenta verificada indicator */}
                  {user.isVerified && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 border border-green-100/50 px-3.5 py-2 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      Cuenta verificada
                    </div>
                  )}

                  {/* Botón Guardar Cambios */}
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full sm:w-auto bg-brand-yellow hover:bg-brand-yellow-hover text-brand-purple-dark text-xs font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-yellow-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>

        {/* MIS PEDIDOS */}
        <div className="mt-12">
          <h2 className="text-2xl font-black text-brand-purple-dark leading-tight tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-brand-purple" />
            Mis Pedidos
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Historial de tus pedidos realizados en la tienda.
          </p>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-purple-50 rounded-3xl p-10 text-center shadow-sm mt-6">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-brand-purple-dark mt-4">No tienes pedidos aún</h3>
              <p className="text-[11px] text-gray-400 mt-1">Tus pedidos aparecerán aquí después de tu primera compra.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-6">
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                const statusColor = {
                  Pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
                  Preparando: "bg-blue-100 text-blue-700 border-blue-200",
                  "Listo para recoger": "bg-green-100 text-green-700 border-green-200",
                  Recogido: "bg-gray-100 text-gray-500 border-gray-200",
                }[order.status as string] || "bg-purple-100 text-purple-700 border-purple-200";

                return (
                  <div key={order.id} className="bg-white border border-purple-50 rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-purple-50/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-purple-light flex items-center justify-center">
                          <Package className="w-5 h-5 text-brand-purple" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-brand-purple-dark text-xs">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("es-PE", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                          {order.status}
                        </span>
                        <span className="font-black text-brand-purple-dark text-sm">
                          S/ {order.total.toFixed(2)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-purple-50 px-4 md:px-5 py-4 bg-purple-50/20 space-y-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                          <Store className="w-3.5 h-3.5" />
                          Recojo en: <span className="text-brand-purple-dark">{order.address}</span>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-gray-400 font-bold">{item.quantity}x</span>
                                <span className="text-brand-purple-dark font-semibold truncate">{item.product.name}</span>
                              </div>
                              <span className="text-gray-500 shrink-0 ml-2">S/ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold pt-1 border-t border-purple-100/50">
                          <Clock className="w-3 h-3" />
                          Pedido #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Avatar Cropper Modal */}
      {showCropper && cropperImage && (
        <AvatarCropper
          image={cropperImage}
          onSave={handleAvatarSave}
          onCancel={() => {
            setShowCropper(false);
            setCropperImage(null);
          }}
        />
      )}

      {/* Overlay de carga al subir avatar */}
      {avatarUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-brand-purple-dark">Subiendo foto...</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
