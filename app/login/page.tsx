"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../context/UserContext";
import { Mail, Lock, User as UserIcon, Phone, CreditCard, ShieldAlert } from "lucide-react";
import ImagePlaceholder from "../../components/ImagePlaceholder";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, signup, loginWithGoogle, loading } = useUser();

  // Estados del formulario
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");

  // Control de errores y estados de carga
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Detectar callback de Google OAuth
  useEffect(() => {
    const googleUser = searchParams.get("google_user");
    if (googleUser) {
      setGoogleLoading(true);
      loginWithGoogle(googleUser, "", "").then((res) => {
        if (res.success) window.location.href = "/location";
      }).finally(() => setGoogleLoading(false));
    }
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const messages: Record<string, string> = {
        google_auth_failed: "La autenticación con Google falló.",
        token_exchange_failed: "Error al intercambiar el token de Google.",
        userinfo_failed: "Error al obtener información de tu cuenta de Google.",
        login_failed: "Error al iniciar sesión con Google.",
        server_error: "Error del servidor al procesar la autenticación.",
        google_not_configured: "Google Login no está configurado. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env",
      };
      if (messages[errorParam]) setErrors({ form: messages[errorParam] });
    }
  }, [searchParams, loginWithGoogle, router]);

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    if (user) {
      if (!user.location) {
        router.replace("/location");
      } else {
        router.replace("/store");
      }
    }
  }, [user, router]);

  // Validaciones
  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "El correo electrónico es requerido.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Formato de correo electrónico inválido.";
    }

    if (!isRegister) {
      if (!password) {
        newErrors.password = "La contraseña es requerida.";
      }
    } else {
      if (!name.trim()) newErrors.name = "El nombre es requerido.";
      if (!lastname.trim()) newErrors.lastname = "El apellido es requerido.";
      
      if (dni && dni.length < 8) {
        newErrors.dni = "El DNI debe tener al menos 8 caracteres.";
      }
      if (phone && phone.length < 9) {
        newErrors.phone = "El teléfono debe tener al menos 9 dígitos.";
      }

      if (!password) {
        newErrors.password = "La contraseña es requerida.";
      } else if (password.length < 5) {
        newErrors.password = "La contraseña debe tener al menos 5 caracteres.";
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitLoading(true);
    setErrors({});

    try {
      if (isRegister) {
        const res = await signup({
          name,
          lastname,
          email,
          password,
          dni: dni || undefined,
          phone: phone || undefined,
        });

        if (res.success) {
          router.push("/location");
        } else {
          setErrors({ form: res.error || "Ocurrió un error en el registro." });
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          router.push("/");
        } else {
          setErrors({ form: res.error || "Credenciales incorrectas." });
        }
      }
    } catch (err) {
      setErrors({ form: "Error de conexión con el servidor." });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || googleLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-neutral-bg">
        <div className="w-10 h-10 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-screen w-full bg-neutral-bg select-none">
      
      {/* Columna Izquierda: Banner Promocional */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-tr from-purple-50 via-purple-100/40 to-pink-50 p-16 relative overflow-hidden">
        {/* Adornos flotantes */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-purple-200/50 rounded-3xl blur-2xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-yellow-100/70 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-purple to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <span className="font-bold text-lg">S</span>
          </div>
          <span className="font-black text-2xl tracking-tight text-brand-purple">
            SmartStock
          </span>
        </div>

        {/* Mensaje Central */}
        <div className="my-auto max-w-lg z-10">
          <h1 className="text-5xl font-black text-brand-purple-dark leading-tight tracking-tight">
            La mejor Bodega <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-pink-500">
              Virtual
            </span>{" "}
            en tus manos.
          </h1>
          <p className="text-gray-500 text-sm mt-6 leading-relaxed">
            Encuentra tus productos preferidos, combos y promociones especiales, con la mejor plataforma de conveniencia a tus manos.
          </p>

          {/* Social Proof */}
          <div className="flex items-center gap-4 mt-10">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-300 flex items-center justify-center text-[10px] font-bold text-white">A</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-pink-300 flex items-center justify-center text-[10px] font-bold text-white">M</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-yellow-300 flex items-center justify-center text-[10px] font-bold text-white">J</div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Únete a más de <span className="text-brand-purple font-bold">5,000+ usuarios</span>.
            </span>
          </div>
        </div>

        {/* Sticker decorativo (Imagen 0 abajo derecha) */}
        <div className="absolute bottom-10 right-10 w-36 h-48 bg-yellow-200/60 rounded-2xl border border-yellow-200/80 shadow-lg shadow-yellow-100/50 flex flex-col justify-between p-4 rotate-6 group hover:rotate-0 transition-transform">
          <div className="w-5 h-5 rounded-full bg-yellow-300/60" />
          <div className="text-[10px] font-bold text-brand-purple-dark leading-snug">
            Tus marcas favoritas en un solo lugar
          </div>
        </div>
      </div>

      {/* Columna Derecha: Formulario */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12 lg:w-1/2">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-100/50 border border-purple-50 p-8 md:p-10 relative">
          
          {/* Header del formulario */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-black text-brand-purple-dark tracking-tight">
              {isRegister ? "¡Regístrate ahora!" : "¡Hola de nuevo!"}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {isRegister
                ? "Completa tus datos para crear una cuenta."
                : "Ingresa tus credenciales para continuar."}
            </p>
          </div>

          {/* Alerta de Error General */}
          {errors.form && (
            <div className="mb-6 p-4.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                    Nombre
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-purple-50/30 text-xs px-4 py-3 rounded-2xl border ${
                        errors.name ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                      } focus:outline-none focus:bg-white transition-all`}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="Rivera Méndez"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className={`w-full bg-purple-50/30 text-xs px-4 py-3 rounded-2xl border ${
                      errors.lastname ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                    } focus:outline-none focus:bg-white transition-all`}
                  />
                  {errors.lastname && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.lastname}</p>}
                </div>
              </div>
            )}

            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                {/* DNI */}
                <div>
                  <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                    DNI
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="12345678X"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className={`w-full bg-purple-50/30 text-xs px-4 py-3 rounded-2xl border ${
                        errors.dni ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                      } focus:outline-none focus:bg-white transition-all`}
                    />
                  </div>
                  {errors.dni && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.dni}</p>}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="+51 600000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full bg-purple-50/30 text-xs px-4 py-3 rounded-2xl border ${
                      errors.phone ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                    } focus:outline-none focus:bg-white transition-all`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.phone}</p>}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                Email de Negocio
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="usuario@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-purple-50/30 text-xs pl-11 pr-4 py-3 rounded-2xl border ${
                    errors.email ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                  } focus:outline-none focus:bg-white transition-all`}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-brand-purple-dark uppercase tracking-wider">
                  Contraseña
                </label>
                {!isRegister && (
                  <Link href="/forgot-password" className="text-[10px] font-bold text-brand-purple hover:underline">
                    ¿La olvidaste?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-purple-50/30 text-xs pl-11 pr-4 py-3 rounded-2xl border ${
                    errors.password ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                  } focus:outline-none focus:bg-white transition-all`}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.password}</p>}
            </div>

            {/* Confirmar Password (sólo registro) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-purple-50/30 text-xs pl-11 pr-4 py-3 rounded-2xl border ${
                      errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-purple-100 focus:border-brand-purple"
                    } focus:outline-none focus:bg-white transition-all`}
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Mantener sesión iniciada */}
            {!isRegister && (
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-purple-200 text-brand-purple focus:ring-brand-purple w-3.5 h-3.5"
                />
                <label htmlFor="remember" className="text-xs text-gray-400 font-semibold cursor-pointer">
                  Mantener sesión iniciada
                </label>
              </div>
            )}

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-sm font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-100 hover:shadow-purple-200 focus:outline-none cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {submitLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : isRegister ? (
                "Crear cuenta ahora"
              ) : (
                "Entrar ahora"
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-50"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              O continúa con
            </span>
          </div>

          {/* Google Button */}
          <a
            href="/api/auth/google"
            className="w-full border border-purple-100 hover:bg-purple-50/50 text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-gray-600 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.49 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.21 7.42 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.54c-.26-.77-.41-1.6-.41-2.46s.15-1.69.41-2.46L1.39 6.6C.5 8.38 0 10.36 0 12.46s.5 4.08 1.39 5.86l3.89-3.02z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.11-3.96 1.11-3.13 0-5.79-2.38-6.72-5.54l-3.89 3.02C3.37 20.33 7.35 23 12 23z"
              />
            </svg>
            Google
          </a>

          {/* Toggle de Registro / Login */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrors({});
              }}
              type="button"
              className="text-xs font-bold text-gray-400 hover:text-brand-purple transition-colors"
            >
              {isRegister ? (
                <>
                  ¿Ya eres miembro?{" "}
                  <span className="text-brand-purple hover:underline">Inicia sesión ahora</span>
                </>
              ) : (
                <>
                  ¿Eres nuevo por aquí?{" "}
                  <span className="text-brand-purple hover:underline">Regístrate ahora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center min-h-screen bg-neutral-bg">
        <div className="w-10 h-10 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
