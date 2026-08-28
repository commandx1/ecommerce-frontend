import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Every internal link in the app must point at a route that exists.
 *
 * This is a whole-codebase invariant rather than a per-component assertion because the failure it
 * guards is invisible in unit tests: a `<Link href="/orders">` renders and passes every component
 * test while sending the user to a 404. On 28 Aug 2026 twelve such links were live at once —
 * four of the five items in the site's main navigation, three dashboard menu entries, and the
 * "Contact Support" button on the 404 page itself (so a lost user's way out was another 404).
 *
 * The scan is deliberately static: it reads the source rather than rendering, so a link that only
 * appears in a rare branch is still checked.
 */

const ROOT = join(__dirname, "../..")
const APP_DIR = "src/app"

/** Every file under a directory, as paths relative to `ROOT`. */
function filesUnder(dir: string, extensions: string[]): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .map((entry) => `${dir}/${entry.split("\\").join("/")}`)
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
}

/** Route patterns from the filesystem, with `[id]` / `[...slug]` turned into matchers. */
function routeMatchers(): RegExp[] {
  return filesUnder(APP_DIR, ["/page.tsx"])
    .map((file) => {
      const route = file.slice(APP_DIR.length, -"/page.tsx".length) || "/"
      // Route groups like (marketing) do not appear in the URL.
      return route.replace(/\/\([^)]+\)/g, "") || "/"
    })
    .map((route) => {
      const source = route.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+")
      return new RegExp(`^${source}$`)
    })
}

/**
 * Static string literals assigned to a link-ish key. Template literals and variables are skipped
 * on purpose: they cannot be resolved without running the code, and a false positive here would
 * be worse than a miss - it would train people to ignore this test.
 */
const LINK_LITERAL = /(?:href|link|url|path)\s*[:=]\s*["']([^"'{}]+)["']/g

/** Not app routes: API handlers, the BFF prefix, and files served straight out of `public/`. */
function isAppRoute(target: string): boolean {
  if (!target.startsWith("/") || target.startsWith("//")) return false
  if (target.startsWith("/api/") || target.startsWith("/backend-api/")) return false
  return !/\.[a-z0-9]{2,4}$/i.test(target)
}

function collectLinks(): Map<string, Set<string>> {
  const skipped = ["src/test/", "src/mocks/", "src/lib/api/", "src/app/api/"]
  const files = filesUnder("src", [".ts", ".tsx"]).filter(
    (file) =>
      !file.endsWith(".test.ts") && !file.endsWith(".test.tsx") && !skipped.some((prefix) => file.startsWith(prefix)),
  )

  const links = new Map<string, Set<string>>()
  for (const file of files) {
    const source = readFileSync(join(ROOT, file), "utf8")
    for (const match of source.matchAll(LINK_LITERAL)) {
      const raw = match[1]
      if (!isAppRoute(raw)) continue
      const target = (raw.split("?")[0].split("#")[0].replace(/\/$/, "") || "/") as string
      const owners = links.get(target) ?? new Set<string>()
      owners.add(file)
      links.set(target, owners)
    }
  }
  return links
}

describe("internal links", () => {
  it("every internal link points at a route that exists", () => {
    const matchers = routeMatchers()
    const dead: string[] = []

    for (const [target, owners] of collectLinks()) {
      if (matchers.some((pattern) => pattern.test(target))) continue
      dead.push(`${target} (linked from ${[...owners].sort().join(", ")})`)
    }

    expect(dead.sort()).toEqual([])
  })

  // Guards the guard: if the scan stopped finding links at all, the test above would pass
  // vacuously and a whole class of 404s would slip back in unnoticed.
  it("actually finds the links it is supposed to be checking", () => {
    const links = collectLinks()

    expect(links.size).toBeGreaterThan(10)
    expect(links.has("/products")).toBe(true)
    expect(links.has("/cart")).toBe(true)
  })
})
