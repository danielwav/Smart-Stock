"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { resetPasswordAction } from "../../lib/actions";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Enlace de recuperación inválido.");
      return;
    }
    if (!password || password.length < 5) {
      setError("La contraseña debe tener al menos 5 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordAction(token, password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(res.error || "Error al restablecer la contraseña.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-black text-brand-purple-dark mt-4">Enlace inválido</h2>
          <p className="text-xs text-gray-400 mt-2">El enlace de recuperación no es válido o ha expirado.</p>
          <Link href="/forgot-password" className="mt-6 inline-block text-sm font-bold text-brand-purple hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-100/50 border border-purple-50 p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-brand-purple-dark">Restablecer contraseña</h1>
          <p className="text-sm text-gray-400 mt-2">Ingresa tu nueva contraseña.</p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mt-4">Contraseña restablecida exitosamente.</p>
            <p className="text-xs text-gray-400 mt-1">Redirigiendo al inicio de sesión...</p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold py-3.5 rounded-2xl text-center transition-all"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-purple-50/30 text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-purple-100 focus:border-brand-purple focus:outline-none focus:bg-white transition-all"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-purple-50/30 text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-purple-100 focus:border-brand-purple focus:outline-none focus:bg-white transition-all"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-sm font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-100 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Restablecer contraseña"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
