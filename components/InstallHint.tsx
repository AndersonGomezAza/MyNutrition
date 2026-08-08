"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "mynutrition-install-hint-dismissed";

/**
 * iOS Safari has no `beforeinstallprompt` — there's no native "Install
 * this app" banner to hook into, so the only way to tell someone how to
 * add the app to their home screen is to say so ourselves.
 */
export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS-specific flag; not in the standard lib.dom.d.ts navigator type.
      (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const isIOSSafari =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      /safari/i.test(navigator.userAgent) &&
      !/crios|fxios/i.test(navigator.userAgent);
    if (!isIOSSafari) return;

    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <p>
          Instala MyNutrition: toca <span className="font-semibold">Compartir</span> (el ícono
          con la flecha hacia arriba) y luego{" "}
          <span className="font-semibold">&quot;Agregar a inicio&quot;</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISSED_KEY, "1");
            setVisible(false);
          }}
          className="shrink-0 rounded-md border border-emerald-300 px-2 py-1 text-xs font-medium hover:bg-emerald-100"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
