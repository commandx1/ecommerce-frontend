import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Stryker-only Vitest config. Bypasses vitest.workspace.ts on purpose: Stryker's
 * vitest-runner does not support multi-project workspaces cleanly, and this task only
 * needs the jsdom project's test files (everything in scope except src/proxy.test.ts,
 * which runs under the node project — see vitest.stryker.node.config.mts).
 *
 * Mirrors the jsdom project block in vitest.workspace.ts exactly (same alias, same
 * setupFiles, same environment). Do NOT edit vitest.workspace.ts for this.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**", "src/proxy.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
