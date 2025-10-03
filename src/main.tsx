import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/animations.css";
import "./scrollbar-handler.js";

createRoot(document.getElementById("root")!).render(<App />);

// Registrar service worker para PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado:", registration.scope);

        // Detectar novas atualizações e ativar
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Forçar reload quando novo controlador assumir
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("Novo Service Worker ativo, recarregando página...");
          window.location.reload();
        });

        // Checar por atualização em background
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      })
      .catch((error) => {
        console.warn("Falha ao registrar Service Worker:", error);
      });
  });
}
