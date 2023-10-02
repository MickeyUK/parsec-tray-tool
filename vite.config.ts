import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
  },
  // 3. to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ["VITE_", "TAURI_"],
  assetsInclude: ["public/**/*.*", "**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif", "**/*.ico", "src/**/*.svg", "src/**/*.png", "src/**/*.jpg", "src/**/*.gif", "src/**/*.ico"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
