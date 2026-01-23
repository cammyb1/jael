import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dts from "unplugin-dts/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  build: {
    target: "esnext",
    minify: true,
    sourcemap: false,
    emptyOutDir: true,
    outDir: "dist",
    lib: {
      name: "@jael/core",
      entry: resolve(__dirname, "src/index.ts"),
      fileName: "jael-build",
      formats: ["es", "cjs"],
    },
  },
  server: {
    port: 5173,
  },
  plugins: [dts({ tsconfigPath: "./tsconfig.json" })],
}));
