import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    include: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    exclude: [
      "node_modules",
      ".next",
      "dist",
      "coverage",
    ],
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
