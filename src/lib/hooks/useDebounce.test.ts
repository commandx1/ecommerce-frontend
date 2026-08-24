import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDebounce } from "./useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300))
    expect(result.current).toBe("initial")
  })

  it("does not update the value before the delay elapses", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: 300 },
    })

    rerender({ value: "b", delay: 300 })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe("a")
  })

  it("updates the value once the delay has fully elapsed", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: 300 },
    })

    rerender({ value: "b", delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe("b")
  })

  it("resets the timer when a new value arrives before the delay elapses (last value wins)", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: 300 },
    })

    rerender({ value: "b", delay: 300 })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe("a")

    // A newer value arrives before "b" would have committed - the timer restarts.
    rerender({ value: "c", delay: 300 })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    // Still "a": neither "b" nor "c" has had a full 300ms uninterrupted window yet.
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe("c")
  })

  it("clears the pending timer on unmount and never calls setState after unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")
    const { rerender, unmount } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: 300 },
    })

    rerender({ value: "b", delay: 300 })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()

    // Advancing timers after unmount must not throw or warn about updating an unmounted component.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(300)
      })
    }).not.toThrow()

    clearTimeoutSpy.mockRestore()
  })

  it("updates on the next tick when delay is 0", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: 0 },
    })

    rerender({ value: "b", delay: 0 })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current).toBe("b")
  })

  it("waits out a very large delay without updating early", () => {
    const largeDelay = 60 * 60 * 1000 // 1 hour
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: largeDelay },
    })

    rerender({ value: "b", delay: largeDelay })

    act(() => {
      vi.advanceTimersByTime(largeDelay - 1)
    })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe("b")
  })
})
