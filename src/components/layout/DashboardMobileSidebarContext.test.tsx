import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DashboardMobileSidebarProvider, useDashboardMobileSidebar } from "./DashboardMobileSidebarContext"

describe("DashboardMobileSidebarContext", () => {
  it("throws a descriptive error when used outside DashboardMobileSidebarProvider", () => {
    expect(() => renderHook(() => useDashboardMobileSidebar())).toThrow(
      "useDashboardMobileSidebar must be used within a DashboardMobileSidebarProvider",
    )
  })

  it("starts closed", () => {
    const { result } = renderHook(() => useDashboardMobileSidebar(), { wrapper: DashboardMobileSidebarProvider })
    expect(result.current.isOpen).toBe(false)
  })

  it("open() sets isOpen to true", () => {
    const { result } = renderHook(() => useDashboardMobileSidebar(), { wrapper: DashboardMobileSidebarProvider })

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)
  })

  it("open() is idempotent when already open", () => {
    const { result } = renderHook(() => useDashboardMobileSidebar(), { wrapper: DashboardMobileSidebarProvider })

    act(() => {
      result.current.open()
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)
  })

  it("close() sets isOpen to false", () => {
    const { result } = renderHook(() => useDashboardMobileSidebar(), { wrapper: DashboardMobileSidebarProvider })

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it("close() is idempotent when already closed", () => {
    const { result } = renderHook(() => useDashboardMobileSidebar(), { wrapper: DashboardMobileSidebarProvider })

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it("toggle() flips isOpen on each call", () => {
    const { result } = renderHook(() => useDashboardMobileSidebar(), { wrapper: DashboardMobileSidebarProvider })

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggle()
      result.current.toggle()
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)
  })

  it("keeps open/close/toggle referentially stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useDashboardMobileSidebar(), {
      wrapper: DashboardMobileSidebarProvider,
    })

    const { open, close, toggle } = result.current
    rerender()

    expect(result.current.open).toBe(open)
    expect(result.current.close).toBe(close)
    expect(result.current.toggle).toBe(toggle)
  })
})
