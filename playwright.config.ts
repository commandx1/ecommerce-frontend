import { defineConfig, devices } from "@playwright/test"

const isCI = Boolean(process.env.CI)

// Faz 8.2 - e2e's own isolated fake backend + Next.js instance.
//
// `/`, `/products`, `/products/:id` are Server Components that fetch
// `BACKEND_URL` directly from the Next.js SERVER process (see
// tests/e2e/mock-backend/server.mjs's header comment for the exact list of
// modules and the confirmed route inventory). Those requests never reach the
// browser, so `page.route`-based mocking (tests/e2e/fixtures/api-mock.fixture.ts)
// structurally cannot see or stub them. This config therefore boots a second,
// deterministic "backend" (tests/e2e/mock-backend/server.mjs, plain Node
// `http`, port 4010) and a dedicated Next.js instance for e2e (port 3100,
// `BACKEND_URL` pointed at the fake backend) - completely separate from
// whatever real dev server / real backend the developer may have running on
// :3000 / :8081.
//
// Port 3100 instead of `next dev`: empirically verified (see the task's
// investigation) that `next dev` takes an exclusive lock at
// `.next/dev/lock` - a second `next dev -p 3100` in the SAME project
// directory while a `next dev` on :3000 is already running fails immediately
// with "Unable to acquire lock ... is another instance of next dev
// running?". `next build && next start -p 3100` does NOT hit this: Next 16's
// `experimental.isolatedDevBuild` (on by default) makes `next dev` write to
// `.next/dev/*`, while `next build`/`next start` write to `.next/*` (root) -
// two completely disjoint subtrees, confirmed by inspecting
// `node_modules/next/dist/server/config.js` and by actually running a build
// (`.next/dev/lock`, `.next/dev/cache`, etc. untouched) while :3000's dev
// server kept serving 200s throughout. Cost: ~30s local build time added
// before the first e2e run (subsequent runs reuse the built `.next` + the
// already-running :3100/:4010 servers via `reuseExistingServer`). CI already
// paid this build cost before this change (`npm run build && npm run start`)
// - only the port/env and the second webServer entry are new for CI.
const MOCK_BACKEND_URL = "http://127.0.0.1:4010"
const E2E_APP_URL = "http://localhost:3100"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Both projects hit the SAME single-process `next start` on :3100, so worker
  // count is bounded by that server, not by CPU cores. Playwright's default
  // (half the cores) saturates it and produces timeouts that look like flaky
  // tests but are really queueing - capped deliberately instead of papering
  // over it with retries.
  workers: isCI ? 1 : 3,
  // CI: list for the log + html for the uploaded artifact; local: list only.
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  // Explicit timeouts so a hung page fails fast instead of hitting the 30 s test default.
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: E2E_APP_URL,
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    // `npm run test:e2e` runs both projects against the SAME :3100 server, so
    // SSR navigations queue up; 15 s was tight enough to flake under that load.
    navigationTimeout: 30_000,
  },
  webServer: [
    {
      // Fake backend for the SSR-only fetches - see tests/e2e/mock-backend/server.mjs.
      command: "node --experimental-strip-types tests/e2e/mock-backend/server.mjs",
      url: `${MOCK_BACKEND_URL}/__health`,
      reuseExistingServer: !isCI,
      timeout: 15_000,
    },
    {
      // Dedicated Next.js instance for e2e, pointed at the fake backend above.
      // Always build+start (see the comment block above for why `next dev`
      // can't run a second instance in this same directory).
      command: "npm run build && npm run start -- -p 3100",
      url: E2E_APP_URL,
      reuseExistingServer: !isCI,
      timeout: isCI ? 300_000 : 180_000,
      env: {
        BACKEND_URL: MOCK_BACKEND_URL,
        PORT: "3100",
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Responsive sidebar / mobile order list coverage.
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      // Desktop-layout specs: they drive the desktop search box / filter sidebar /
      // dashboard data tables, which are CSS-hidden or replaced by card lists at
      // 412px. They are verified on `chromium`; mobile coverage for those screens
      // is tracked in TEST-FINDINGS.md (Faz 8) rather than faked here.
      testIgnore: [
        "**/browse-to-cart.spec.ts",
        "**/cart-management.spec.ts",
        "**/vendor-orders.spec.ts",
        "**/vendor-products.spec.ts",
      ],
    },
  ],
})
