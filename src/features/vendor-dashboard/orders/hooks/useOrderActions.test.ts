import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, it, vi } from "vitest"
import type { VendorOrderListParams } from "@/lib/query/keys"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { makeVendorOrderItem } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useOrderActions } from "./useOrderActions"

const LIST_PARAMS: VendorOrderListParams = {
  page: 0,
  size: 10,
  sortBy: null,
  sortDir: null,
  type: "ALL",
  orderId: null,
}

const setup = () => {
  const { wrapper, client } = createQueryWrapper()
  return { ...renderHook(() => useOrderActions(LIST_PARAMS), { wrapper }), client }
}

/**
 * F6 regression guard: a mid-delivery cancel or an approved return restocks the item, but neither
 * action used to invalidate the vendor's product list - so its stock/status columns and stat
 * cards kept showing pre-restock numbers until an unrelated products refetch happened to land.
 */
describe("useOrderActions — product-list freshness", () => {
  it("invalidates vendor product stats after a mid-delivery cancel", async () => {
    server.use(
      http.post("*/backend-api/orders/cancelBySeller", () =>
        HttpResponse.json({
          message: "Cancellation sent",
          successCount: 1,
          failureCount: 0,
          cancelledOrderItemIds: ["vitem-1"],
        }),
      ),
    )
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    await act(() => result.current.handleCancelDuringDelivery(["vitem-1"], "Cancelled by seller"))

    await waitFor(() =>
      expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.vendor.products.all),
    )
  })

  it("does not invalidate vendor product stats when the cancel request fails", async () => {
    server.use(http.post("*/backend-api/orders/cancelBySeller", () => new HttpResponse(null, { status: 500 })))
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    await act(() => result.current.handleCancelDuringDelivery(["vitem-1"], "Cancelled by seller"))

    await waitFor(() => expect(result.current.cancelingItemId).toBeNull())
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).not.toContainEqual(
      queryKeys.vendor.products.all,
    )
  })

  it("invalidates vendor product stats after a return is confirmed", async () => {
    server.use(
      http.post("*/backend-api/orders/sellerConfirmReturn", () =>
        HttpResponse.json({ message: "Return confirmed", refundAmount: 100, orderItemIds: ["vitem-2"] }),
      ),
    )
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    await act(() => result.current.handleConfirmReturn(makeVendorOrderItem({ id: "vitem-2" })))

    await waitFor(() =>
      expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.vendor.products.all),
    )
  })

  it("does not invalidate vendor product stats when a return rejection is filed instead", async () => {
    server.use(
      http.post("*/backend-api/orders/sellerRejectReturn", () =>
        HttpResponse.json({ message: "Return rejected", orderItemIds: ["vitem-3"] }),
      ),
    )
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    await act(() => result.current.handleRejectReturn("vitem-3", "Item not eligible"))

    await waitFor(() => expect(result.current.returnActionItemId).toBeNull())
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).not.toContainEqual(
      queryKeys.vendor.products.all,
    )
  })
})
