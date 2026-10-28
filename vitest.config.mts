import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Logic-only test setup: default node environment (no jsdom), with the "@/"
// path alias mirrored from tsconfig and a localStorage polyfill for the
// zustand persist store.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
