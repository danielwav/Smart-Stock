"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { forgotPasswordAction } from "../../lib/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugLink, setDebugLink] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await forgotPasswordAction(email);
      if (res.success) {
        setSuccess(true);
        if (res.debugLink) setDebugLink(res.debugLink);
      } else {
        setError(res.error || "Error al enviar el correo.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-100/50 border border-purple-50 p-8 md:p-10">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs font-bold text-brand-purple hover:underline mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio de sesión
          </Link>
          <h1 className="text-2xl font-black text-brand-purple-dark">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-gray-400 mt-2">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
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
            <p className="text-sm font-semibold text-gray-600 mt-4 leading-relaxed">
              Revisa tu bandeja de entrada. Te hemos enviado un enlace para restablecer tu contraseña.
            </p>
            {debugLink && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-left">
                <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1">Modo demostración</p>
                <p className="text-xs text-yellow-600">Haz clic en el siguiente enlace (simulado):</p>
                <a
                  href={debugLink}
                  className="mt-2 block text-xs font-bold text-brand-purple underline break-all hover:text-purple-700"
                >
                  {debugLink}
                </a>
              </div>
            )}
            <Link
              href="/login"
              className="mt-6 inline-block w-full bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold py-3.5 rounded-2xl text-center transition-all"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-purple-dark mb-1.5 uppercase tracking-wider">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-purple-50/30 text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-purple-100 focus:border-brand-purple focus:outline-none focus:bg-white transition-all"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
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
                "Enviar enlace de recuperación"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
