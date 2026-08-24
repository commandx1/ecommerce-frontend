import { fileURLToPath } from "node:url"
import { defineWorkspace } from "vitest/config"

/**
 * Two projects, one config.
 *
 * Server-side code (Route Handlers, the `proxy` middleware, `server/` data fetchers) is driven
 * with real `NextRequest`/`Response` objects and the undici fetch stack. jsdom replaces both with
 * browser shims, which silently changes body/stream/header semantics, so those suites run in the
 * `node` environment with their own setup file. Everything else keeps the jsdom setup.
 *
 * Coverage stays configured in `vitest.config.mts` — it is a root-level option, so a single
 * `npm run test:coverage` run still measures both projects with the same include/exclude/thresholds.
 *
 * NOTE: the projects deliberately do NOT `extends: "./vitest.config.mts"`. Vitest merges extended
 * arrays by concatenation, which would union both `include` lists and both `setupFiles` — the node
 * project would then load the jsdom setup and die on `window`. The only thing worth inheriting is
 * the `@` alias, which is repeated below.
 *
 * NOTE: Vitest 2.1 has no inline `test.projects`; the workspace has to live in its own file.
 * When the project moves to Vitest 3+, this collapses into `test.projects` in `vitest.config.mts`.
 */
const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
}

const NODE_TEST_GLOBS = [
  "src/app/api/**/*.test.ts",
  "src/**/server/*.test.ts",
  "src/proxy.test.ts",
  "src/lib/api/server-*.test.ts",
]

const SHARED_EXCLUDE = ["**/node_modules/**", "**/dist/**", "tests/e2e/**"]

export default defineWorkspace([
  {
    resolve: { alias },
    test: {
      name: "jsdom",
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      exclude: [...SHARED_EXCLUDE, ...NODE_TEST_GLOBS],
    },
  },
  {
    resolve: { alias },
    test: {
      name: "node",
      environment: "node",
      globals: true,
      setupFiles: ["./src/test/setup.node.ts"],
      include: NODE_TEST_GLOBS,
      exclude: SHARED_EXCLUDE,
    },
  },
])
