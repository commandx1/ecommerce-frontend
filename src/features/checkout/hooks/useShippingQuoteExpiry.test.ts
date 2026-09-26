import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import { SHIPPING_QUOTE_TTL_MS } from "@/features/checkout/lib/shipping-quote-expiry"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { useShippingQuoteExpiry } from "./useShippingQuoteExpiry"

/**
 * The single timer that expires a step-2 shipping quote once the buyer reaches billing/review
 * (steps 3-4). Scheduled to the exact remaining ms (not a poll), and re-checked on
 * `focus`/`visibilitychange` because a background tab's timers can be throttled or fully
 * suspended and miss the moment entirely.
 */

let warningToast: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
  warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

const setQuoteAt = (currentStep: 1 | 2 | 3 | 4 | 5, fetchedAt: number, isPlacingOrder = false) => {
  useCheckoutStore.setState({ currentStep, shippingQuoteFetchedAt: fetchedAt, isPlacingOrder })
}

describe("useShippingQuoteExpiry — fires at the exact expiry moment", () => {
  it("expires a step-3 quote exactly when SHIPPING_QUOTE_TTL_MS elapses", () => {
    setQuoteAt(3, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS - 1)
    })
    expect(warningToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(3)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(warningToast).toHaveBeenCalledWith(
      "Shipping rates expired",
      "Shipping prices can change. Please choose a shipping method again.",
    )
    expect(useCheckoutStore.getState().currentStep).toBe(2)
    expect(useCheckoutStore.getState().shippingQuoteFetchedAt).toBeNull()
  })

  it("expires a step-4 quote the same way", () => {
    setQuoteAt(4, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS)
    })

    expect(warningToast).toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("never schedules or fires on step 5 (order already placed)", () => {
    setQuoteAt(5, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS * 2)
    })

    expect(warningToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(5)
  })

  it("never schedules or fires on step 1 or 2", () => {
    setQuoteAt(2, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS * 2)
    })

    expect(warningToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("does nothing when no quote has been taken yet (fetchedAt is null)", () => {
    useCheckoutStore.setState({ currentStep: 3, shippingQuoteFetchedAt: null })
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS * 2)
    })

    expect(warningToast).not.toHaveBeenCalled()
  })
})

describe("useShippingQuoteExpiry — in-flight order submission", () => {
  it("does not interrupt an order submission in flight, even past the expiry moment", () => {
    setQuoteAt(4, Date.now(), true)
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS * 2)
    })

    expect(warningToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(4)
  })

  it("re-checks as soon as the submission finishes, catching a quote that expired while in flight", () => {
    setQuoteAt(4, Date.now(), true)
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.advanceTimersByTime(SHIPPING_QUOTE_TTL_MS * 2)
    })
    expect(warningToast).not.toHaveBeenCalled()

    // Flushed through its own `act` so the effect re-runs (scheduling its already-due timer)
    // before the next `act` advances the clock to let it fire - otherwise the timer would not
    // exist yet for that advance to flush.
    act(() => {
      useCheckoutStore.getState().setIsPlacingOrder(false)
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(warningToast).toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })
})

describe("useShippingQuoteExpiry — background/throttled tab", () => {
  it("does not fire via its own timer while backgrounded, but catches up on focus", () => {
    setQuoteAt(3, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    // Simulate a background tab: wall-clock time (and thus Date.now()) moves past the expiry
    // moment WITHOUT the scheduled setTimeout ever being allowed to fire - real browsers throttle
    // or fully suspend a hidden tab's timers, so this must not depend on that callback running.
    act(() => {
      vi.setSystemTime(Date.now() + SHIPPING_QUOTE_TTL_MS + 5000)
    })
    expect(warningToast).not.toHaveBeenCalled()

    act(() => {
      window.dispatchEvent(new Event("focus"))
    })

    expect(warningToast).toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("also catches up on visibilitychange", () => {
    setQuoteAt(3, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.setSystemTime(Date.now() + SHIPPING_QUOTE_TTL_MS + 5000)
    })
    expect(warningToast).not.toHaveBeenCalled()

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(warningToast).toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("a focus/visibilitychange before expiry is a no-op", () => {
    setQuoteAt(3, Date.now())
    renderHook(() => useShippingQuoteExpiry())

    act(() => {
      vi.setSystemTime(Date.now() + SHIPPING_QUOTE_TTL_MS - 1000)
      window.dispatchEvent(new Event("focus"))
    })

    expect(warningToast).not.toHaveBeenCalled()
    expect(useCheckoutStore.getState().currentStep).toBe(3)
  })
})
