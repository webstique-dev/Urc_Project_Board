import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "dnd-vendor": ["@hello-pangea/dnd"],
          "daypicker-vendor": ["react-day-picker"],
          "icons-vendor": ["lucide-react"],
          "socket-vendor": ["socket.io-client"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
