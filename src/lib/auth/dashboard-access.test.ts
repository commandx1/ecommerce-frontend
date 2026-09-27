import { describe, expect, it } from "vitest"
import {
  DASHBOARD_ACCESS_POLICIES,
  type DashboardRole,
  decideAfterHydration,
  decideInitialAccess,
  RETURN_TO_MAX_LENGTH,
  readStoredSession,
  resolveCrossRoleReturnTo,
} from "./dashboard-access"

const buyerUser = { roleName: "Dentist" }
const vendorUser = { roleName: "Vendor" }

function envelope(user: unknown, isAuthenticated: boolean): string {
  return JSON.stringify({ state: { user, isAuthenticated }, version: 0 })
}

describe("readStoredSession", () => {
  it("returns null for an empty/absent cookie", () => {
    expect(readStoredSession(null, DASHBOARD_ACCESS_POLICIES.buyer)).toBeNull()
    expect(readStoredSession("", DASHBOARD_ACCESS_POLICIES.buyer)).toBeNull()
  })

  it("parses a well-formed cookie for both roles", () => {
    const raw = envelope(buyerUser, true)
    expect(readStoredSession(raw, DASHBOARD_ACCESS_POLICIES.buyer)).toEqual({ user: buyerUser, isAuthenticated: true })
    expect(readStoredSession(raw, DASHBOARD_ACCESS_POLICIES.vendor)).toEqual({ user: buyerUser, isAuthenticated: true })
  })

  it("row 10: user present but isAuthenticated:false -> null (falls to the store branch)", () => {
    const raw = envelope(buyerUser, false)
    expect(readStoredSession(raw, DASHBOARD_ACCESS_POLICIES.buyer)).toBeNull()
  })

  it("row 10b: isAuthenticated:true but no user -> null", () => {
    const raw = envelope(null, true)
    expect(readStoredSession(raw, DASHBOARD_ACCESS_POLICIES.buyer)).toBeNull()
  })

  it("row 11: URI-encoded JSON - buyer does not decode (null), vendor decodes it", () => {
    const raw = encodeURIComponent(envelope(vendorUser, true))
    expect(readStoredSession(raw, DASHBOARD_ACCESS_POLICIES.buyer)).toBeNull()
    expect(readStoredSession(raw, DASHBOARD_ACCESS_POLICIES.vendor)).toEqual({
      user: vendorUser,
      isAuthenticated: true,
    })
  })

  it("row 12: garbage JSON -> null for both roles, never throws", () => {
    expect(() => readStoredSession("not-json{{{", DASHBOARD_ACCESS_POLICIES.buyer)).not.toThrow()
    expect(readStoredSession("not-json{{{", DASHBOARD_ACCESS_POLICIES.buyer)).toBeNull()
    expect(readStoredSession("not-json{{{", DASHBOARD_ACCESS_POLICIES.vendor)).toBeNull()
  })
})

interface InitialAccessCase {
  name: string
  role: DashboardRole
  stored: { user: { roleName?: string }; isAuthenticated: boolean } | null
  store: { user: { roleName?: string } | null; isAuthenticated: boolean }
  wasAuthenticated: boolean
  expected: ReturnType<typeof decideInitialAccess>
}

const initialAccessCases: InitialAccessCase[] = [
  {
    name: "buyer row 1/9-ish: stored right role -> await hydration",
    role: "buyer",
    stored: { user: buyerUser, isAuthenticated: true },
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: false,
    expected: { kind: "await-hydration" },
  },
  {
    name: "buyer row 2: stored wrong role -> immediate cross-role redirect",
    role: "buyer",
    stored: { user: vendorUser, isAuthenticated: true },
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/vendor-dashboard" },
  },
  {
    name: "buyer row 6: no stored session, store unauthenticated, never authed -> /login",
    role: "buyer",
    stored: null,
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/login" },
  },
  {
    name: "buyer row 6 variant: no stored session, store unauthenticated, was authed -> /",
    role: "buyer",
    stored: null,
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: true,
    expected: { kind: "redirect", to: "/" },
  },
  {
    name: "buyer row 8: no stored session, store wrong role -> cross-role redirect",
    role: "buyer",
    stored: null,
    store: { user: vendorUser, isAuthenticated: true },
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/vendor-dashboard" },
  },
  {
    name: "buyer row 9: no stored session, store right role -> allow",
    role: "buyer",
    stored: null,
    store: { user: buyerUser, isAuthenticated: true },
    wasAuthenticated: false,
    expected: { kind: "allow" },
  },
  {
    name: "vendor row 1: stored right role -> await hydration",
    role: "vendor",
    stored: { user: vendorUser, isAuthenticated: true },
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: false,
    expected: { kind: "await-hydration" },
  },
  {
    name: "vendor row 2: stored wrong role -> immediate cross-role redirect",
    role: "vendor",
    stored: { user: buyerUser, isAuthenticated: true },
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/buyer-dashboard" },
  },
  {
    name: "vendor row 6: no stored session, store unauthenticated -> /login (no wasAuth concept)",
    role: "vendor",
    stored: null,
    store: { user: null, isAuthenticated: false },
    wasAuthenticated: true,
    expected: { kind: "redirect", to: "/login" },
  },
  {
    name: "vendor row 8: no stored session, store wrong role -> cross-role redirect",
    role: "vendor",
    stored: null,
    store: { user: buyerUser, isAuthenticated: true },
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/buyer-dashboard" },
  },
  {
    name: "vendor row 9: no stored session, store right role -> allow",
    role: "vendor",
    stored: null,
    store: { user: vendorUser, isAuthenticated: true },
    wasAuthenticated: false,
    expected: { kind: "allow" },
  },
]

describe.each(initialAccessCases)("decideInitialAccess: $name", (testCase) => {
  it("matches the design table", () => {
    const policy = DASHBOARD_ACCESS_POLICIES[testCase.role]
    expect(decideInitialAccess(policy, testCase.stored, testCase.store, testCase.wasAuthenticated)).toEqual(
      testCase.expected,
    )
  })
})

interface AfterHydrationCase {
  name: string
  role: DashboardRole
  currentUser: { roleName?: string } | null
  wasAuthenticated: boolean
  expected: ReturnType<typeof decideAfterHydration>
}

const afterHydrationCases: AfterHydrationCase[] = [
  {
    name: "buyer row 3: user still null, never authed -> /login",
    role: "buyer",
    currentUser: null,
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/login" },
  },
  {
    name: "buyer row 4: user still null, was authed earlier this mount -> /",
    role: "buyer",
    currentUser: null,
    wasAuthenticated: true,
    expected: { kind: "redirect", to: "/" },
  },
  {
    name: "buyer row 5: user now has the wrong role -> cross-role redirect",
    role: "buyer",
    currentUser: vendorUser,
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/vendor-dashboard" },
  },
  {
    name: "buyer row 1: user right role -> allow",
    role: "buyer",
    currentUser: buyerUser,
    wasAuthenticated: false,
    expected: { kind: "allow" },
  },
  {
    name: "vendor row 3/4: user still null (wasAuth irrelevant) -> /buyer-dashboard",
    role: "vendor",
    currentUser: null,
    wasAuthenticated: true,
    expected: { kind: "redirect", to: "/buyer-dashboard" },
  },
  {
    name: "vendor row 5: user now has the wrong role -> /buyer-dashboard",
    role: "vendor",
    currentUser: buyerUser,
    wasAuthenticated: false,
    expected: { kind: "redirect", to: "/buyer-dashboard" },
  },
  {
    name: "vendor row 1: user right role -> allow",
    role: "vendor",
    currentUser: vendorUser,
    wasAuthenticated: false,
    expected: { kind: "allow" },
  },
]

describe.each(afterHydrationCases)("decideAfterHydration: $name", (testCase) => {
  it("matches the design table", () => {
    const policy = DASHBOARD_ACCESS_POLICIES[testCase.role]
    expect(decideAfterHydration(policy, testCase.currentUser, testCase.wasAuthenticated)).toEqual(testCase.expected)
  })
})

describe("DASHBOARD_ACCESS_POLICIES render targets (row 7)", () => {
  it("buyer renders a skeleton while unauthorized", () => {
    expect(DASHBOARD_ACCESS_POLICIES.buyer.unauthorizedRender).toBe("skeleton")
  })

  it("vendor renders nothing while unauthorized", () => {
    expect(DASHBOARD_ACCESS_POLICIES.vendor.unauthorizedRender).toBe("nothing")
  })
})

describe("resolveCrossRoleReturnTo", () => {
  // The guard on the WRONG dashboard: buyer layout recovering a vendor tab, vendor layout
  // recovering a buyer tab. Only the tab's own dashboard area is an acceptable destination.
  const vendorTabOnBuyerDashboard = DASHBOARD_ACCESS_POLICIES.buyer
  const buyerTabOnVendorDashboard = DASHBOARD_ACCESS_POLICIES.vendor

  it("accepts a page inside the tab's own dashboard, query and all", () => {
    expect(resolveCrossRoleReturnTo(vendorTabOnBuyerDashboard, "/vendor-dashboard/orders")).toBe(
      "/vendor-dashboard/orders",
    )
    expect(resolveCrossRoleReturnTo(vendorTabOnBuyerDashboard, "/vendor-dashboard")).toBe("/vendor-dashboard")
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/buyer-dashboard/favorites?tab=vendors")).toBe(
      "/buyer-dashboard/favorites?tab=vendors",
    )
  })

  it("rejects the other role's area (would just bounce again)", () => {
    expect(resolveCrossRoleReturnTo(vendorTabOnBuyerDashboard, "/buyer-dashboard/orders")).toBeNull()
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/vendor-dashboard/orders")).toBeNull()
  })

  it("rejects pages outside any dashboard and lookalike prefixes", () => {
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/")).toBeNull()
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/cart")).toBeNull()
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/login")).toBeNull()
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/buyer-dashboard-info")).toBeNull()
    expect(resolveCrossRoleReturnTo(vendorTabOnBuyerDashboard, "/vendor-dashboardx/orders")).toBeNull()
  })

  it.each([
    "https://evil.com",
    "https://evil.com/buyer-dashboard",
    "//evil.com/buyer-dashboard",
    "/\\evil.com/buyer-dashboard",
    "/\t/evil.com/buyer-dashboard",
    "javascript:alert(1)",
    "buyer-dashboard/orders",
    "%2Fbuyer-dashboard%2Forders",
  ])("rejects an off-origin or malformed value: %s", (raw) => {
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, raw)).toBeNull()
  })

  it("area-checks the normalised path, so dot segments cannot escape it", () => {
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/buyer-dashboard/../vendor-dashboard")).toBeNull()
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "/buyer-dashboard/../login")).toBeNull()
  })

  it("ignores empty, absent and over-long values", () => {
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, null)).toBeNull()
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, "")).toBeNull()
    const long = `/buyer-dashboard/orders?q=${"a".repeat(RETURN_TO_MAX_LENGTH)}`
    expect(resolveCrossRoleReturnTo(buyerTabOnVendorDashboard, long)).toBeNull()
  })
})
