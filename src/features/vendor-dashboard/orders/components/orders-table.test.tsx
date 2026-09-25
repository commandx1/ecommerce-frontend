import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { type UseOrdersColumnsParams, useOrdersColumns } from "./orders-table"

/**
 * Regression test for the S9b remount hazard (see the doc comment on `useOrdersColumns`):
 * `flexRender` keys a cell's React element by the identity of its `header`/`cell` function. A
 * fresh inline arrow function on every render tears down and remounts that cell's DOM subtree,
 * which can silently drop a click that lands mid-render (userEvent drives a click as a
 * pointerdown/pointerup pair, not one synchronous event) - exactly the interactive cells here
 * ("Call Uber" / "Cancel", the sort headers, the row expander).
 */

const baseParams = (): UseOrdersColumnsParams => ({
  sortBy: "createdDate",
  sortDir: "desc",
  processingOrderId: null,
  cancelingOrderId: null,
  uberProcessedOrderIds: [],
  onSortToggle: vi.fn(),
  onCallUber: vi.fn(),
  onRequestCancel: vi.fn(),
})

const byId = (columns: ReturnType<typeof useOrdersColumns>, id: string) => {
  const column = columns.find((c) => c.id === id)
  if (!column) throw new Error(`no column with id "${id}"`)
  return column
}

describe("useOrdersColumns", () => {
  it("keeps every cell/header function identity stable across a re-render with the same props", () => {
    const params = baseParams()
    const { result, rerender } = renderHook((p: UseOrdersColumnsParams) => useOrdersColumns(p), {
      initialProps: params,
    })

    const before = result.current
    rerender(params)
    const after = result.current

    for (const id of ["buyer", "created", "quantity", "items", "price", "shipping", "status", "action", "expander"]) {
      expect(after ? byId(after, id).cell : undefined).toBe(byId(before, id).cell)
      expect(after ? byId(after, id).header : undefined).toBe(byId(before, id).header)
    }
  })

  it("only invalidates the sort headers when sortBy/sortDir change, not the unrelated cells", () => {
    const params = baseParams()
    const { result, rerender } = renderHook((p: UseOrdersColumnsParams) => useOrdersColumns(p), {
      initialProps: params,
    })
    const before = result.current

    rerender({ ...params, sortBy: "price", sortDir: "asc" })
    const after = result.current

    expect(byId(after, "created").header).not.toBe(byId(before, "created").header)
    expect(byId(after, "price").header).not.toBe(byId(before, "price").header)
    // Cells (not headers) never read sort state, and the buyer/expander columns don't sort at all.
    expect(byId(after, "buyer").cell).toBe(byId(before, "buyer").cell)
    expect(byId(after, "action").cell).toBe(byId(before, "action").cell)
    expect(byId(after, "expander").cell).toBe(byId(before, "expander").cell)
    expect(byId(after, "expander").header).toBe(byId(before, "expander").header)
  })

  it("only invalidates the action cell when an order moves into an in-flight state, not the rest of the row", () => {
    const params = baseParams()
    const { result, rerender } = renderHook((p: UseOrdersColumnsParams) => useOrdersColumns(p), {
      initialProps: params,
    })
    const before = result.current

    rerender({ ...params, processingOrderId: "order-1" })
    const after = result.current

    expect(byId(after, "action").cell).not.toBe(byId(before, "action").cell)
    expect(byId(after, "buyer").cell).toBe(byId(before, "buyer").cell)
    expect(byId(after, "created").cell).toBe(byId(before, "created").cell)
    expect(byId(after, "created").header).toBe(byId(before, "created").header)
    expect(byId(after, "expander").cell).toBe(byId(before, "expander").cell)
  })
})
