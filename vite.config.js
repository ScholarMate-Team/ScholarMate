import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://34.228.112.95",   // ✅ 실제 백엔드 주소
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://34.228.112.95",
        changeOrigin: true,
        secure: false,
      },
      "/static": {
        target: "http://34.228.112.95",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: { outDir: "dist" },
});
