import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CATEGORY_COUNTS_TAG } from "@/lib/cache/category-counts"
import { server } from "@/mocks/server"

const cacheSpies = vi.hoisted(() => ({
  updateTag: vi.fn(),
}))
vi.mock("next/cache", () => ({ updateTag: cacheSpies.updateTag }))

/**
 * `revalidateCategoryCounts` reads the `auth-storage` cookie via `next/headers` and verifies the
 * access token against the backend before purging — mocked per test so we can control both the
 * cookie contents and whether the backend confirms a Vendor session.
 */
const mockCookiesGet = vi.fn<(name: string) => { value: string } | undefined>()
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mockCookiesGet }),
}))

function setAuthCookie(accessToken: string | null) {
  if (accessToken === null) {
    mockCookiesGet.mockReturnValue(undefined)
    return
  }
  mockCookiesGet.mockReturnValue({ value: JSON.stringify({ state: { accessToken } }) })
}

const { revalidateCategoryCounts } = await import("./revalidate-category-counts")

const ME = "*/api/users/me"

describe("revalidateCategoryCounts", () => {
  beforeEach(() => {
    cacheSpies.updateTag.mockClear()
    setAuthCookie(null)
  })

  it("does not call updateTag when there is no auth cookie at all", async () => {
    await revalidateCategoryCounts()

    expect(cacheSpies.updateTag).not.toHaveBeenCalled()
  })

  it("does not call updateTag when the backend rejects the token", async () => {
    setAuthCookie("stale-token")
    server.use(http.get(ME, () => new HttpResponse(null, { status: 401 })))

    await revalidateCategoryCounts()

    expect(cacheSpies.updateTag).not.toHaveBeenCalled()
  })

  it("does not call updateTag for an authenticated non-vendor (e.g. a Dentist)", async () => {
    setAuthCookie("dentist-token")
    server.use(http.get(ME, () => HttpResponse.json({ roleName: "Dentist" })))

    await revalidateCategoryCounts()

    expect(cacheSpies.updateTag).not.toHaveBeenCalled()
  })

  it("calls updateTag with the shared category-counts tag for a verified Vendor", async () => {
    setAuthCookie("vendor-token")
    server.use(
      http.get(ME, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer vendor-token")
        return HttpResponse.json({ roleName: "Vendor" })
      }),
    )

    await revalidateCategoryCounts()

    expect(cacheSpies.updateTag).toHaveBeenCalledTimes(1)
    expect(cacheSpies.updateTag).toHaveBeenCalledWith(CATEGORY_COUNTS_TAG)
  })

  it("swallows a backend error instead of throwing, and does not purge", async () => {
    setAuthCookie("vendor-token")
    server.use(http.get(ME, () => HttpResponse.error()))

    await expect(revalidateCategoryCounts()).resolves.toBeUndefined()
    expect(cacheSpies.updateTag).not.toHaveBeenCalled()
  })

  it("swallows an error from updateTag instead of throwing", async () => {
    setAuthCookie("vendor-token")
    server.use(http.get(ME, () => HttpResponse.json({ roleName: "Vendor" })))
    cacheSpies.updateTag.mockImplementationOnce(() => {
      throw new Error("no action context")
    })

    await expect(revalidateCategoryCounts()).resolves.toBeUndefined()
  })
})
