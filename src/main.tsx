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
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { Auth } from "./features/auth/Auth";
import { Login } from "./features/auth/Login";
import { Profile } from "./features/profile";
import Chat from "./features/chat/Chat";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Auth>
        <App />
      </Auth>
    ),
    children: [
      {
        index: true,
        element: <Chat />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
