import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: webRoot,
  resolve: {
    alias: {
      "@": webRoot,
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
