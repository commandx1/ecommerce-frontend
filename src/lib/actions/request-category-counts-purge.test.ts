import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const revalidateCategoryCountsSpy = vi.hoisted(() => vi.fn())
vi.mock("./revalidate-category-counts", () => ({
  revalidateCategoryCounts: revalidateCategoryCountsSpy,
}))

const { requestCategoryCountsPurge } = await import("./request-category-counts-purge")

/**
 * `requestCategoryCountsPurge` exists because every caller used `void revalidateCategoryCounts()`
 * to keep the purge fire-and-forget - fine for errors the action itself swallows (see its own
 * try/catch), but a request that never reaches the server (offline, a dropped connection) rejects
 * the OUTER promise the "use server" call returns, and `void` on a rejecting promise is an
 * unhandled rejection in the browser console. This wrapper is the one place that catches it.
 */
describe("requestCategoryCountsPurge", () => {
  const unhandledRejections: unknown[] = []
  const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason)

  beforeEach(() => {
    revalidateCategoryCountsSpy.mockReset()
    unhandledRejections.length = 0
    process.on("unhandledRejection", onUnhandledRejection)
  })

  afterEach(() => {
    process.off("unhandledRejection", onUnhandledRejection)
  })

  it("swallows a rejected purge request instead of leaking an unhandled promise rejection, and warns once", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    revalidateCategoryCountsSpy.mockRejectedValue(new Error("Failed to fetch"))

    requestCategoryCountsPurge()
    // Flush the microtask queue so the wrapper's `.catch` has a chance to run (and, on the old
    // code, so a real unhandled rejection would have a chance to be reported too).
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(unhandledRejections).toEqual([])
    expect(warnSpy).toHaveBeenCalledTimes(1)

    warnSpy.mockRestore()
  })

  it("requests the purge exactly once when the action resolves", async () => {
    revalidateCategoryCountsSpy.mockResolvedValue(undefined)

    requestCategoryCountsPurge()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1)
    expect(unhandledRejections).toEqual([])
  })
})
