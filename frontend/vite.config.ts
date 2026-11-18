import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` (development, staging, production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: 6010,
      proxy: {
        "/api": {
          // Backend URL from .env (VITE_PROXY_TARGET); only used once the API exists.
          target: env.VITE_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
