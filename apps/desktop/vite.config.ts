import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    /* The @pepbits/* packages resolve via symlink to ../../packages/*. Dedupe React
       so the app and the packages share ONE copy — two copies make every hook throw
       "Cannot read properties of null (reading 'useState')", which reads like a
       broken component rather than a resolution problem. */
    dedupe: ["react", "react-dom"],
  },
  clearScreen: false,
  server: {
    port: 3001,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
    fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
  },
  build: { target: "es2021", outDir: "dist" },
});
