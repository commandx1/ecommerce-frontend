import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Whole-tree import-boundary invariant, generalized at the end of Phase 4 (design doc §7, Z) from
 * the two per-feature versions that grew up separately during the vendor (S11) and buyer (B1-B5)
 * moves:
 *
 * - `src/features/**` must not import from `@/app/**` at all. By this point every shared piece
 *   any feature used to reach into `app/` for (order leaves, the auth guard, panel/tone-map
 *   primitives, account-settings components) has moved to `components/`, `lib/` or `features/`,
 *   so there is no legitimate reason left for a feature to import from `app/`.
 * - `src/app/{buyer,vendor}-dashboard/**` route shells (`page.tsx`) import only from
 *   `@/features/...` (plus framework built-ins): every route is a thin `<XxxPage />` wrapper, and
 *   a shell reaching past that into deep feature internals would be a sign the boundary eroded.
 * - `src/components/dashboard-shared/**` (the role-agnostic presentational layer, §3) imports no
 *   `@/features/**`, `@/stores/**` or `@/lib/api/**`: it must stay a leaf components can share
 *   without pulling in a feature's data layer or app state.
 *
 * Biome's `noRestrictedImports` (biome.jsonc) enforces the app/feature rule for editor/CI
 * feedback; this test is the harder-to-fool, whole-tree backstop and does not depend on Biome
 * config staying correct.
 */

const ROOT = join(__dirname, "..", "..")

function filesUnder(dir: string, extensions: string[]): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .map((entry) => `${dir}/${entry.split("\\").join("/")}`)
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
}

const IMPORT_SOURCE = /(?:from|import)\s+["']([^"']+)["']/g

function importsIn(file: string): string[] {
  const source = readFileSync(join(ROOT, file), "utf8")
  return [...source.matchAll(IMPORT_SOURCE)].map((match) => match[1] as string)
}

function isTestFile(file: string): boolean {
  return file.endsWith(".test.ts") || file.endsWith(".test.tsx")
}

function nonTestFilesUnder(dir: string): string[] {
  return filesUnder(dir, [".ts", ".tsx"]).filter((file) => !isTestFile(file))
}

describe("features import boundary", () => {
  it("src/features/** does not import from @/app/** at all", () => {
    const files = nonTestFilesUnder("src/features")
    const violations: string[] = []

    for (const file of files) {
      for (const source of importsIn(file)) {
        if (!source.startsWith("@/app/")) continue
        violations.push(`${file} imports "${source}"`)
      }
    }

    expect(violations.sort()).toEqual([])
  })

  it("app/{buyer,vendor}-dashboard route shells (page.tsx) import only from @/features/...", () => {
    const shells = [
      ...filesUnder("src/app/buyer-dashboard", ["/page.tsx"]),
      ...filesUnder("src/app/vendor-dashboard", ["/page.tsx"]),
    ]
    const violations: string[] = []

    for (const file of shells) {
      for (const source of importsIn(file)) {
        if (!source.startsWith("@/")) continue
        if (source.startsWith("@/features/")) continue
        violations.push(`${file} imports "${source}"`)
      }
    }

    expect(violations.sort()).toEqual([])
  })

  it("components/dashboard-shared imports no @/features/**, @/stores/** or @/lib/api/**", () => {
    const files = nonTestFilesUnder("src/components/dashboard-shared")
    const violations: string[] = []

    for (const file of files) {
      for (const source of importsIn(file)) {
        if (source.startsWith("@/features/") || source.startsWith("@/stores/") || source.startsWith("@/lib/api/")) {
          violations.push(`${file} imports "${source}"`)
        }
      }
    }

    expect(violations.sort()).toEqual([])
  })

  // Guards the guards: if any scan above stopped finding files or imports, its assertion would
  // pass vacuously and the boundary could silently erode again.
  it("actually scans a meaningful number of files for every rule above", () => {
    const featureFiles = nonTestFilesUnder("src/features")
    expect(featureFiles.length).toBeGreaterThan(400)

    const shells = [
      ...filesUnder("src/app/buyer-dashboard", ["/page.tsx"]),
      ...filesUnder("src/app/vendor-dashboard", ["/page.tsx"]),
    ]
    expect(shells.length).toBeGreaterThan(15)
    expect(shells.flatMap((file) => importsIn(file)).some((source) => source.startsWith("@/features/"))).toBe(true)

    const sharedFiles = nonTestFilesUnder("src/components/dashboard-shared")
    expect(sharedFiles.length).toBeGreaterThan(5)
  })
})
