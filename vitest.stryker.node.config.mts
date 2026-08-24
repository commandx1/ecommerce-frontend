import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Stryker-only Vitest config for src/proxy.ts. Mirrors the "node" project block in
 * vitest.workspace.ts (real NextRequest/Response, undici fetch — jsdom shims would change
 * semantics). See vitest.stryker.jsdom.config.mts for why we bypass the workspace file
 * rather than editing it.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.node.ts"],
    include: ["src/proxy.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
