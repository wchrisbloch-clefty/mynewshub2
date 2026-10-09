import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";   // design tokens (must load before component styles)
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ─── Stale lazy-chunk recovery (H5/H4) ──────────────────────────────────────
// After a redeploy, an already-open tab may try to import a hashed chunk whose URL
// now 404s. Vite fires `vite:preloadError`; we reload ONCE (guarded against a loop)
// so the tab fetches the new HTML + chunk graph. Never caches /api/*.
window.addEventListener("vite:preloadError", () => {
  try {
    if (!sessionStorage.getItem("mnh-chunk-reloaded")) {
      sessionStorage.setItem("mnh-chunk-reloaded", "1");
      window.location.reload();
    }
  } catch { window.location.reload(); }
});

// ─── PWA service worker (G3) ────────────────────────────────────────────────
// KILL SWITCH: set SW_KILL = true to disable the PWA — on the next load it
// unregisters any existing worker and clears its caches (no app-shell caching).
const SW_KILL = false;
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (SW_KILL) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => {
        r.active && r.active.postMessage("KILL");
        r.unregister();
      }));
      if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
    } else {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  });
}
