import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Import-boundary invariant for the Phase 3 vendor-dashboard move (design doc §1, §S11):
 *
 * - `src/app/vendor-dashboard/**` route shells import only from `@/features/...` (plus framework
 *   built-ins). They stopped importing feature internals directly once every route became a thin
 *   `<XxxPage />` wrapper; a shell reaching past that back into deep feature paths would be a sign
 *   the boundary eroded again.
 * - `src/features/vendor-dashboard/**` must not import from `@/app/vendor-dashboard/**`. The one
 *   allowed exception is `components/shared/{DashboardPanel,dashboardToneMaps}`, which stay under
 *   `app/` until Phase 4 moves them to `features/vendor-dashboard/shared/` (marked `// P4-shared`
 *   at their definitions). Biome's `noRestrictedImports` (biome.jsonc) enforces the same rule for
 *   editor/CI feedback; this test is the harder-to-fool, whole-tree backstop and does not depend
 *   on Biome config staying correct.
 */

const ROOT = join(__dirname, "../../..")

const ALLOWED_APP_TO_FEATURES_CARVE_OUTS = [
  "@/app/vendor-dashboard/components/shared/DashboardPanel",
  "@/app/vendor-dashboard/components/shared/dashboardToneMaps",
]

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

describe("vendor-dashboard import boundary", () => {
  it("features/vendor-dashboard does not import from app/vendor-dashboard, except the P4-shared carve-out", () => {
    const files = filesUnder("src/features/vendor-dashboard", [".ts", ".tsx"]).filter((file) => !isTestFile(file))
    const violations: string[] = []

    for (const file of files) {
      for (const source of importsIn(file)) {
        if (!source.startsWith("@/app/vendor-dashboard/")) continue
        if (ALLOWED_APP_TO_FEATURES_CARVE_OUTS.includes(source)) continue
        violations.push(`${file} imports "${source}"`)
      }
    }

    expect(violations.sort()).toEqual([])
  })

  it("app/vendor-dashboard route shells (page.tsx) import only from @/features/...", () => {
    const files = filesUnder("src/app/vendor-dashboard", ["/page.tsx"])
    const violations: string[] = []

    for (const file of files) {
      for (const source of importsIn(file)) {
        if (!source.startsWith("@/")) continue
        if (source.startsWith("@/features/")) continue
        violations.push(`${file} imports "${source}"`)
      }
    }

    expect(violations.sort()).toEqual([])
  })

  // Guards the guard: if the scans above stopped finding files or imports, both assertions would
  // pass vacuously and the boundary could silently erode again.
  it("actually scans the files and imports it is supposed to be checking", () => {
    const featureFiles = filesUnder("src/features/vendor-dashboard", [".ts", ".tsx"]).filter(
      (file) => !isTestFile(file),
    )
    const carveOutUsages = featureFiles.flatMap((file) =>
      importsIn(file).filter((source) => source.startsWith("@/app/vendor-dashboard/")),
    )
    expect(featureFiles.length).toBeGreaterThan(50)
    expect(carveOutUsages.length).toBeGreaterThan(0)

    const shells = filesUnder("src/app/vendor-dashboard", ["/page.tsx"])
    expect(shells.length).toBeGreaterThan(10)
    expect(shells.flatMap((file) => importsIn(file)).some((source) => source.startsWith("@/features/"))).toBe(true)
  })
})
