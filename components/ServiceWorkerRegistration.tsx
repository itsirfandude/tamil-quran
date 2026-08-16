"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const checkForUpdate = () => {
      if (document.visibilityState !== "visible" || !registration) return;
      registration.update().catch(() => {
        // Offline support is progressive enhancement; app startup must continue.
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registered) => {
        registration = registered;
        checkForUpdate();
      })
      .catch(() => {
        // Offline support is progressive enhancement; app startup must continue.
      });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
