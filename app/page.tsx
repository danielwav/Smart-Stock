"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

export default function Home() {
  const { user, loading, location } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!location) {
        router.replace("/location");
      } else {
        router.replace("/store");
      }
    }
  }, [user, loading, location, router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-neutral-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-brand-purple tracking-wide">Cargando SmartStock...</p>
      </div>
    </div>
  );
}
