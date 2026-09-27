import { v4 as uuidv4 } from "uuid";

// Polyfill window.crypto.randomUUID if missing (e.g., in non-secure HTTP contexts on mobile)
if (typeof window !== "undefined") {
  try {
    if (!window.crypto) {
      (window as unknown as { crypto: unknown }).crypto = {} as Crypto;
    }
    if (typeof window.crypto.randomUUID !== "function") {
      window.crypto.randomUUID =
        uuidv4 as () => `${string}-${string}-${string}-${string}-${string}`;
    }
  } catch {
    // Ignore polyfill errors
  }
}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Auth } from "./features/auth/Auth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth>
      <App />
    </Auth>
  </StrictMode>,
);
