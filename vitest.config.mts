import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    coverage: {
      // Ratchet: pinned ~2 points below the coverage actually achieved at the end of each
      // phase, so new code cannot lower coverage while the existing suite stays green.
      //   Phase 1 (pure utils & constants):   7.83 stmts / 49.56 branch / 25.82 funcs
      //   Phase 2 (lib/api contract tests):  12.15 stmts / 62.00 branch / 40.51 funcs
      //   Phase 3 (stores + auth plumbing):  14.60 stmts / 67.51 branch / 48.76 funcs
      //   Phase 4 (hook layer):              18.83 stmts / 73.21 branch / 52.64 funcs
      //   Phase 5+6+7 (components + BFF):    69.18 stmts / 83.09 branch / 76.91 funcs
      //   Phase 6b (vendor products+questions): 75.26 stmts / 83.04 branch / 76.83 funcs
      //   Regression + Batch 5 (27 Aug 2026): 76.16 stmts / 83.85 branch / 77.90 funcs
      // Phases 5-7 ran in parallel and landed together; the jump is the storefront, dashboard
      // and route-handler layers arriving at once. Phase 6b closed the two vendor pages worth
      // testing. Branch/function percentages dipped a hair because vendor/products/page.tsx
      // (1564 lines) added more branches to the denominator than its 58 tests cover.
      // Deliberately untested: vendor/promotions/page.tsx renders a hardcoded array with no
      // client-side logic to pin — see TEST-FINDINGS.md, B11.
      // Ratchet: kept ~2 points under the measured figures so a real coverage loss breaks the gate
      // while normal churn does not. Measured 28 Aug 2026: 78.86 stmts / 86.83 branches / 82.72 fns.
      thresholds: {
        statements: 76,
        branches: 84,
        functions: 80,
        lines: 76,
      },
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Vitest skips the report when any test fails; keep it so CI always publishes coverage.
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Test infrastructure
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/mocks/**",
        "**/*.d.ts",

        // Auth screens & flows — owned by the backend team, verified manually
        "src/features/login/**",
        "src/features/register/**",
        "src/features/forgot-password/**",
        "src/features/reset-password/**",
        "src/features/verify-email/**",
        "src/hooks/useRegisterForm.ts",
        "src/app/login/**",
        "src/app/register/**",
        "src/app/forgot-password/**",
        "src/app/reset-password/**",
        "src/app/verify-email/**",
        "src/app/verify-2fa/**",
        "src/app/auth/**",
        "src/app/vendor-manager-add/**",
        "src/app/api/auth/**",
        "src/app/api/mail/**",
        "src/lib/api/auth.ts",
        "src/lib/api/auth-direct.ts",
        "src/lib/api/two-factor.ts",
        "src/lib/api/password-recovery.ts",

        // Next.js framework files (no meaningful branching)
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",

        // Purely presentational shadcn primitives.
        // NOTE: do NOT exclude src/components/ui/** wholesale — QuantityStepper, data-table,
        // pagination, Modal, AsyncSubmitButton, Toast, collapse and horizontal-timeline all
        // carry logic and are slated for testing.
        "src/components/ui/button.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/label.tsx",
        "src/components/ui/textarea.tsx",
        "src/components/ui/checkbox.tsx",
        "src/components/ui/radio.tsx",
        "src/components/ui/select.tsx",
        "src/components/ui/dialog.tsx",
        "src/components/ui/popover.tsx",
        "src/components/ui/tooltip.tsx",
        "src/components/ui/SurfaceCard.tsx",
        "src/components/ui/ActionButton.tsx",

        // Decorative / animation-only components
        "src/components/ui/spotlight-card.tsx",
        "src/components/ui/motion-highlight.tsx",
        "src/components/ui/motion-tabs.tsx",
        "src/components/ui/animated-tabs.tsx",

        // Type-only modules
        "src/features/**/types.ts",
      ],
      // Thresholds are intentionally omitted in this phase: meaningful suites do not exist yet
      // and a gate would fail CI immediately.
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // See vitest.workspace.ts for why this is aliased away in tests.
      "server-only": fileURLToPath(new URL("./src/test/mocks/server-only.ts", import.meta.url)),
    },
  },
})
