import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Auth from "./features/auth";

import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import Login from "./features/auth/Login";
import { useAuthStore } from "./features/auth/store/authStore";

import { ReloadPrompt } from "./components/pwa/ReloadPrompt";

// Initialize auth state from IndexedDB early on application boot
useAuthStore.getState().initialize();
const router = createBrowserRouter([
  {
    path: "/",
    Component: () => (
      <Auth>
        <App />
      </Auth>
    ),
  },
  { path: "login", Component: Login },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <ReloadPrompt />
  </StrictMode>,
);
