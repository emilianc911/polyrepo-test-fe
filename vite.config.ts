import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Where the dev server forwards `/api/*` and `/ws`. Inside Docker compose
  // use the BE service name (e.g. http://api:4000); on bare metal use http://localhost:4000.
  const apiTarget = env.VITE_API_TARGET ?? "http://localhost:4000";
  const wsTarget = apiTarget.replace(/^http/, "ws");

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/ws":  { target: wsTarget,  ws: true },
      },
    },
    preview: {
      host: true,
      port: 4173,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/ws":  { target: wsTarget,  ws: true },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      target: "es2020",
    },
  };
});
