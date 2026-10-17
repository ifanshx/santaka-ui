import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [svelte()],
  // `svelte` ships separate client and server entry points, and the export
  // condition decides which one a test gets. Without this, Vitest resolves the
  // server build and `mount()` throws `lifecycle_function_unavailable` — the
  // tests would be exercising the SSR half of Svelte while claiming to test the
  // DOM half.
  resolve: {
    conditions: ["browser"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    maxWorkers: 2,
  },
})
