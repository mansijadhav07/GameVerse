import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// This log will prove the file is being read
console.log("✅ Reading updated vite.config.ts file...");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

