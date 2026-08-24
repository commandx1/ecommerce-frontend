import { act, renderHook } from "@testing-library/react"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import { autoOrdersAPI } from "@/lib/api/auto-orders"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories"
import { useAutoOrderRegistration } from "./useAutoOrderRegistration"

/**
 * The confirmation screen waits for Stripe's `payment_intent.succeeded` webhook to have written
 * the buyer's recurring schedules. This hook polls `GET /auto-orders` until the userProductIds
 * snapshotted at order time show up.
 *
 * `@/lib/api/auto-orders` is mocked rather than served over MSW so the poll count is exact and
 * no XHR has to survive the faked timers. Only `setTimeout`/`clearTimeout` are faked — faking
 * the whole clock deadlocks MSW + axios elsewhere in this suite.
 */

vi.mock("@/lib/api/auto-orders", () => ({
  autoOrdersAPI: {
    getAutoOrders: vi.fn(),
    updateAutoOrder: vi.fn(),
    deleteAutoOrder: vi.fn(),
  },
}))

const getAutoOrders = vi.mocked(autoOrdersAPI.getAutoOrders)

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 30

const respondWith = (...userProductIds: string[]) =>
  makeAutoOrdersResponse({
    autoOrders: userProductIds.map((userProductId, index) => makeAutoOrder({ id: `ao-${index}`, userProductId })),
    total: userProductIds.length,
  })

/** Runs one poll tick: fires the pending timer and lets the resulting promise settle. */
const tick = async (times = 1) => {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  getAutoOrders.mockReset()
  getAutoOrders.mockResolvedValue(respondWith())
  useCheckoutStore.setState({ autoOrderUserProductIds: [] })
})

afterAll(() => {
  vi.useRealTimers()
})

describe("useAutoOrderRegistration", () => {
  it("never starts polling when the order had no recurring items", async () => {
    const { result } = renderHook(() => useAutoOrderRegistration())

    expect(result.current.status).toBe("none")
    expect(result.current.expectedCount).toBe(0)

    await tick(5)

    expect(getAutoOrders).not.toHaveBeenCalled()
    expect(result.current.status).toBe("none")
  })

  it("starts out pending and does not call the backend before the first interval elapses", () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })

    const { result } = renderHook(() => useAutoOrderRegistration())

    expect(result.current.status).toBe("pending")
    expect(result.current.expectedCount).toBe(1)
    expect(getAutoOrders).not.toHaveBeenCalled()
  })

  it("flips to ready once every expected schedule has landed", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a", "up-b"] })
    getAutoOrders.mockResolvedValue(respondWith("up-a", "up-b"))

    const { result } = renderHook(() => useAutoOrderRegistration())
    await tick()

    expect(getAutoOrders).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("ready")
    expect(result.current.registeredCount).toBe(2)
  })

  it("keeps polling while only some of the schedules exist, then settles on ready", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a", "up-b"] })
    getAutoOrders.mockResolvedValueOnce(respondWith("up-a")).mockResolvedValue(respondWith("up-a", "up-b"))

    const { result } = renderHook(() => useAutoOrderRegistration())

    await tick()
    expect(result.current.status).toBe("pending")
    expect(result.current.registeredCount).toBe(1)

    await tick()
    expect(getAutoOrders).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe("ready")
    expect(result.current.registeredCount).toBe(2)
  })

  it("ignores schedules that were not part of this order", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })
    getAutoOrders.mockResolvedValue(respondWith("up-someone-else", "up-older-order"))

    const { result } = renderHook(() => useAutoOrderRegistration())
    await tick()

    expect(result.current.status).toBe("pending")
    expect(result.current.registeredCount).toBe(0)
  })

  it("swallows a failing poll and tries again", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })
    getAutoOrders.mockRejectedValueOnce(new Error("network")).mockResolvedValue(respondWith("up-a"))

    const { result } = renderHook(() => useAutoOrderRegistration())

    await tick()
    expect(result.current.status).toBe("pending")

    await tick()
    expect(result.current.status).toBe("ready")
  })

  it("gives up with a 'still processing' timeout after the attempt budget is spent", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })
    getAutoOrders.mockResolvedValue(respondWith())

    const { result } = renderHook(() => useAutoOrderRegistration())
    await tick(MAX_ATTEMPTS)

    expect(getAutoOrders).toHaveBeenCalledTimes(MAX_ATTEMPTS)
    expect(result.current.status).toBe("timeout")
    expect(result.current.registeredCount).toBe(0)

    // and the loop is genuinely finished — no runaway background polling
    await tick(5)
    expect(getAutoOrders).toHaveBeenCalledTimes(MAX_ATTEMPTS)
  })

  it("stops polling when the confirmation screen unmounts", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })

    const { unmount } = renderHook(() => useAutoOrderRegistration())
    await tick()
    expect(getAutoOrders).toHaveBeenCalledTimes(1)

    unmount()
    await tick(3)

    expect(getAutoOrders).toHaveBeenCalledTimes(1)
  })

  it("does not restart the loop when the store hands back a new array with the same ids", async () => {
    useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })

    const { rerender } = renderHook(() => useAutoOrderRegistration())
    await tick()
    expect(getAutoOrders).toHaveBeenCalledTimes(1)

    act(() => {
      useCheckoutStore.setState({ autoOrderUserProductIds: ["up-a"] })
    })
    rerender()
    await tick()

    // Two ticks in total, not a fresh loop on top of the running one.
    expect(getAutoOrders).toHaveBeenCalledTimes(2)
  })
})
