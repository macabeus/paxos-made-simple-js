import { defineConfig } from "vite";

export default defineConfig({
  test: {
    testTimeout: 60_000,
    maxConcurrency: 10,
  },
});
