import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDebouncedPerKeyCallback } from "./useDebouncedPerKeyCallback"

describe("useDebouncedPerKeyCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not invoke the callback before the delay elapses", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("cart-item-1", { quantity: 2 })
    })

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(callback).not.toHaveBeenCalled()
  })

  it("invokes the callback with the scheduled payload once the delay elapses", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("cart-item-1", { quantity: 2 })
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ quantity: 2 }, { key: "cart-item-1", isLatest: expect.any(Function) })
  })

  // This is the entire reason the hook exists: scheduling for one key must not reset, cancel,
  // or otherwise interfere with the pending timer of a different key.
  it("does not let one key's debounce affect another key's timer (key isolation)", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("item-A", { quantity: 1 })
    })

    // 200ms later, item-A is still pending (100ms left) when item-B is scheduled fresh.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => {
      result.current.schedule("item-B", { quantity: 5 })
    })

    // 100ms later: item-A's original 300ms window closes (200 + 100), item-B still has 200ms left.
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ quantity: 1 }, { key: "item-A", isLatest: expect.any(Function) })

    // Rescheduling item-A again must not push out or cancel item-B's independent timer.
    act(() => {
      result.current.schedule("item-A", { quantity: 9 })
    })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith({ quantity: 5 }, { key: "item-B", isLatest: expect.any(Function) })

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(callback).toHaveBeenCalledTimes(3)
    expect(callback).toHaveBeenLastCalledWith({ quantity: 9 }, { key: "item-A", isLatest: expect.any(Function) })
  })

  it("collapses rapid successive calls for the same key into a single execution with the latest argument", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("cart-item-1", { quantity: 1 })
      vi.advanceTimersByTime(100)
      result.current.schedule("cart-item-1", { quantity: 2 })
      vi.advanceTimersByTime(100)
      result.current.schedule("cart-item-1", { quantity: 3 })
    })

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ quantity: 3 }, { key: "cart-item-1", isLatest: expect.any(Function) })
  })

  it("reports isLatest() as false once a newer call for the same key has been scheduled", () => {
    const seenIsLatest: boolean[] = []
    const callback = vi.fn((_payload: { quantity: number }, ctx: { isLatest: () => boolean }) => {
      seenIsLatest.push(ctx.isLatest())
    })
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("cart-item-1", { quantity: 1 })
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(seenIsLatest).toEqual([true])

    act(() => {
      result.current.schedule("cart-item-1", { quantity: 2 })
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(seenIsLatest).toEqual([true, true])
  })

  it("cancel() clears a pending timer for one key without affecting other keys", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("item-A", { quantity: 1 })
      result.current.schedule("item-B", { quantity: 2 })
    })

    act(() => {
      result.current.cancel("item-A")
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ quantity: 2 }, { key: "item-B", isLatest: expect.any(Function) })
  })

  it("cancelAll() clears every pending key's timer", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("item-A", { quantity: 1 })
      result.current.schedule("item-B", { quantity: 2 })
      result.current.schedule("item-C", { quantity: 3 })
    })

    act(() => {
      result.current.cancelAll()
    })

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it("clears every pending key's timer on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedPerKeyCallback({ delayMs: 300, callback }))

    act(() => {
      result.current.schedule("item-A", { quantity: 1 })
      result.current.schedule("item-B", { quantity: 2 })
    })

    const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length
    unmount()
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callsBeforeUnmount)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(callback).not.toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })

  it("always calls the latest callback reference, even for a timer scheduled before it changed", () => {
    const firstCallback = vi.fn()
    const secondCallback = vi.fn()
    const { result, rerender } = renderHook(({ callback }) => useDebouncedPerKeyCallback({ delayMs: 300, callback }), {
      initialProps: { callback: firstCallback },
    })

    act(() => {
      result.current.schedule("cart-item-1", { quantity: 1 })
    })

    rerender({ callback: secondCallback })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(firstCallback).not.toHaveBeenCalled()
    expect(secondCallback).toHaveBeenCalledTimes(1)
  })
})
