import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useExpandableList } from "./useExpandableList"

describe("useExpandableList", () => {
  it("shows only the default number of visible items (8) initially", () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    const { result } = renderHook(() => useExpandableList(items))

    expect(result.current.showAll).toBe(false)
    expect(result.current.visibleItems).toEqual(items.slice(0, 8))
  })

  it("respects a custom initialVisible count", () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const { result } = renderHook(() => useExpandableList(items, { initialVisible: 3 }))

    expect(result.current.visibleItems).toEqual([0, 1, 2])
  })

  it("toggleShowAll expands to the full list, and toggling again collapses back", () => {
    const items = Array.from({ length: 12 }, (_, i) => i)
    const { result } = renderHook(() => useExpandableList(items, { initialVisible: 5 }))

    act(() => {
      result.current.toggleShowAll()
    })
    expect(result.current.showAll).toBe(true)
    expect(result.current.visibleItems).toEqual(items)

    act(() => {
      result.current.toggleShowAll()
    })
    expect(result.current.showAll).toBe(false)
    expect(result.current.visibleItems).toEqual(items.slice(0, 5))
  })

  it("returns an empty list when given an empty array, expanded or not", () => {
    const { result } = renderHook(() => useExpandableList<number>([]))

    expect(result.current.visibleItems).toEqual([])

    act(() => {
      result.current.toggleShowAll()
    })
    expect(result.current.visibleItems).toEqual([])
  })

  it("shows every item when the list is shorter than initialVisible, without needing to expand", () => {
    const items = [1, 2, 3]
    const { result } = renderHook(() => useExpandableList(items, { initialVisible: 8 }))

    expect(result.current.visibleItems).toEqual(items)
  })

  it("recomputes visibleItems when the items array changes while collapsed", () => {
    const { result, rerender } = renderHook(({ items }) => useExpandableList(items, { initialVisible: 2 }), {
      initialProps: { items: [1, 2, 3, 4] },
    })

    expect(result.current.visibleItems).toEqual([1, 2])

    rerender({ items: [9, 8, 7, 6, 5] })
    expect(result.current.visibleItems).toEqual([9, 8])
  })
})
