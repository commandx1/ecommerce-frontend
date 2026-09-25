import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Import-boundary invariant for the Phase 4 buyer-dashboard move (design doc §1, §7, B1-B5):
 * `src/features/buyer-dashboard/**` must not import from `@/app/buyer-dashboard/**`. Unlike the
 * vendor-dashboard boundary (S11), there is no carve-out here - every shared piece the buyer
 * side used to reach into `app/` for (order leaves, the auth guard, panel/tone-map primitives)
 * already moved to `components/`, `lib/` or `features/` in earlier Phase 4 steps, so the buyer
 * side has zero legitimate reason to import from `app/`. Biome's `noRestrictedImports`
 * (biome.jsonc) enforces the same rule for editor/CI feedback; this test is the harder-to-fool,
 * whole-tree backstop and does not depend on Biome config staying correct.
 */

const ROOT = join(__dirname, "../../..")

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

describe("buyer-dashboard import boundary", () => {
  it("features/buyer-dashboard does not import from app/buyer-dashboard", () => {
    const files = filesUnder("src/features/buyer-dashboard", [".ts", ".tsx"]).filter((file) => !isTestFile(file))
    const violations: string[] = []

    for (const file of files) {
      for (const source of importsIn(file)) {
        if (!source.startsWith("@/app/buyer-dashboard/")) continue
        violations.push(`${file} imports "${source}"`)
      }
    }

    expect(violations.sort()).toEqual([])
  })

  // Guards the guard: if the scan above stopped finding files, the assertion would pass
  // vacuously and the boundary could silently erode again.
  it("actually scans the files it is supposed to be checking", () => {
    const files = filesUnder("src/features/buyer-dashboard", [".ts", ".tsx"]).filter((file) => !isTestFile(file))
    expect(files.length).toBeGreaterThan(50)
  })
})
