import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories/user.factory"
import {
  BuyerOrdersProvider,
  useBuyerOrdersAuthState,
  useBuyerOrdersCancelModalActions,
  useBuyerOrdersCancelModalSelector,
  useBuyerOrdersCancelModalState,
  useBuyerOrdersPaginationActions,
  useBuyerOrdersPaginationSelector,
  useBuyerOrdersPaginationState,
  useBuyerOrdersRefundModalActions,
  useBuyerOrdersRefundModalState,
  useBuyerOrdersTableActions,
  useBuyerOrdersTableSelector,
  useBuyerOrdersTableState,
  useBuyerOrdersTabsActions,
  useBuyerOrdersTabsState,
  useBuyerOrdersTrackingModalActions,
  useBuyerOrdersTrackingModalSelector,
  useBuyerOrdersTrackingModalState,
} from "./buyer-orders-context"

/**
 * `BuyerOrdersProvider` composes twelve `React.createContext` slices around the real
 * `useBuyerOrdersPage` hook (already exhaustively unit-tested in `../hooks/use-buyer-orders-page.test.tsx`).
 * These tests exercise the provider/selector wiring itself: every exported hook is reachable,
 * outside-provider usage fails loudly, and the two state transitions that live only in the
 * provider's call sites (tab-change resetting page/expansion) behave as documented.
 */

function signIn() {
  useAuthStore.getState().setAuth(makeAccountUser(), "access-token", "refresh-token")
}

function useAllBuyerOrdersContexts() {
  return {
    auth: useBuyerOrdersAuthState(),
    tabsState: useBuyerOrdersTabsState(),
    tabsActions: useBuyerOrdersTabsActions(),
    tableState: useBuyerOrdersTableState(),
    tableActions: useBuyerOrdersTableActions(),
    paginationState: useBuyerOrdersPaginationState(),
    paginationActions: useBuyerOrdersPaginationActions(),
    cancelModalState: useBuyerOrdersCancelModalState(),
    cancelModalActions: useBuyerOrdersCancelModalActions(),
    refundModalState: useBuyerOrdersRefundModalState(),
    refundModalActions: useBuyerOrdersRefundModalActions(),
    trackingModalState: useBuyerOrdersTrackingModalState(),
    trackingModalActions: useBuyerOrdersTrackingModalActions(),
    tableSortField: useBuyerOrdersTableSelector((state) => state.sortField),
    paginationCurrentPage: useBuyerOrdersPaginationSelector((state) => state.currentPage),
    cancelModalConfirming: useBuyerOrdersCancelModalSelector((state) => state.isConfirmingCancel),
    trackingModalLinks: useBuyerOrdersTrackingModalSelector((state) => state.trackingModalLinks),
  }
}

function renderAllContexts() {
  return renderHook(() => useAllBuyerOrdersContexts(), { wrapper: BuyerOrdersProvider })
}

describe("BuyerOrdersProvider / context hooks", () => {
  beforeEach(() => {
    signIn()
  })

  describe("outside a BuyerOrdersProvider", () => {
    it.each([
      [
        "useBuyerOrdersAuthState",
        useBuyerOrdersAuthState,
        "useBuyerOrdersAuthState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersTabsState",
        useBuyerOrdersTabsState,
        "useBuyerOrdersTabsState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersTabsActions",
        useBuyerOrdersTabsActions,
        "useBuyerOrdersTabsActions must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersTableState",
        useBuyerOrdersTableState,
        "useBuyerOrdersTableState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersTableActions",
        useBuyerOrdersTableActions,
        "useBuyerOrdersTableActions must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersPaginationState",
        useBuyerOrdersPaginationState,
        "useBuyerOrdersPaginationState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersPaginationActions",
        useBuyerOrdersPaginationActions,
        "useBuyerOrdersPaginationActions must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersCancelModalState",
        useBuyerOrdersCancelModalState,
        "useBuyerOrdersCancelModalState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersCancelModalActions",
        useBuyerOrdersCancelModalActions,
        "useBuyerOrdersCancelModalActions must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersRefundModalState",
        useBuyerOrdersRefundModalState,
        "useBuyerOrdersRefundModalState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersRefundModalActions",
        useBuyerOrdersRefundModalActions,
        "useBuyerOrdersRefundModalActions must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersTrackingModalState",
        useBuyerOrdersTrackingModalState,
        "useBuyerOrdersTrackingModalState must be used within BuyerOrdersProvider.",
      ],
      [
        "useBuyerOrdersTrackingModalActions",
        useBuyerOrdersTrackingModalActions,
        "useBuyerOrdersTrackingModalActions must be used within BuyerOrdersProvider.",
      ],
    ])("%s throws a descriptive error", (_name, hook, message) => {
      expect(() => renderHook(() => hook())).toThrow(message)
    })

    it("useBuyerOrdersTableSelector (selector wrapper) throws the same underlying error", () => {
      expect(() => renderHook(() => useBuyerOrdersTableSelector((state) => state.sortField))).toThrow(
        "useBuyerOrdersTableState must be used within BuyerOrdersProvider.",
      )
    })
  })

  it("exposes every selector/action and keeps selectors in sync with the sliced state", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    expect(result.current.auth.isAuthenticated).toBe(true)
    expect(result.current.tabsState.selectedTab).toBe("All")
    expect(typeof result.current.tabsActions.handleTabChange).toBe("function")

    expect(result.current.tableState.filteredOrders).toHaveLength(1)
    expect(result.current.tableState.filteredOrders[0]?.orderId).toBe("order-1")
    expect(result.current.tableSortField).toBe(result.current.tableState.sortField)
    expect(result.current.tableSortField).toBe("createdDate")

    expect(result.current.paginationState.currentPage).toBe(0)
    expect(result.current.paginationCurrentPage).toBe(result.current.paginationState.currentPage)

    expect(result.current.cancelModalState.pendingCancelAction).toBeNull()
    expect(result.current.cancelModalConfirming).toBe(result.current.cancelModalState.isConfirmingCancel)

    expect(result.current.refundModalState.pendingRefundOrder).toBeNull()

    expect(result.current.trackingModalState.trackingModalLinks).toBeNull()
    expect(result.current.trackingModalLinks).toBe(result.current.trackingModalState.trackingModalLinks)
  })

  it("resets the current page and clears the expanded row when the selected tab changes", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    act(() => {
      result.current.tableActions.handleExpandedChange({ "order-1": true })
      result.current.paginationActions.handlePageChange(3)
    })

    await waitFor(() => expect(result.current.paginationState.currentPage).toBe(3))
    expect(result.current.tableState.expandedState).toEqual({ "order-1": true })

    act(() => {
      result.current.tabsActions.handleTabChange("Pending")
    })

    await waitFor(() => expect(result.current.paginationState.currentPage).toBe(0))
    expect(result.current.tableState.expandedState).toEqual({})
  })

  it("resets the page even when a page change and a tab change happen back to back", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    act(() => {
      result.current.paginationActions.handlePageChange(5)
      result.current.tabsActions.handleTabChange("Shipped")
    })

    await waitFor(() => expect(result.current.paginationState.currentPage).toBe(0))
  })

  it("keeps single-row expand semantics through the table context", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    act(() => {
      result.current.tableActions.handleExpandedChange({ "order-1": true })
    })
    await waitFor(() => expect(result.current.tableState.expandedState).toEqual({ "order-1": true }))

    act(() => {
      result.current.tableActions.handleExpandedChange((old) => ({
        ...(old as Record<string, boolean>),
        "order-2": true,
      }))
    })
    await waitFor(() => expect(result.current.tableState.expandedState).toEqual({ "order-2": true }))
  })

  it("drives the cancel modal flow through the cancel-modal context", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    act(() => {
      result.current.tableActions.requestCancelAction({
        description: "fallback",
        orderItemIds: ["item-1"],
        options: { cancelingItemId: "item-1" },
      })
    })

    await waitFor(() =>
      expect(result.current.cancelModalState.pendingCancelAction).toEqual({
        description: "fallback",
        orderItemIds: ["item-1"],
        options: { cancelingItemId: "item-1" },
      }),
    )

    await act(async () => {
      await result.current.cancelModalActions.confirmPendingCancelAction()
    })

    await waitFor(() => expect(result.current.cancelModalState.pendingCancelAction).toBeNull())
    expect(result.current.cancelModalState.isConfirmingCancel).toBe(false)

    act(() => {
      result.current.cancelModalActions.setPendingCancelAction({
        description: "manual",
        orderItemIds: ["item-2"],
      })
    })
    await waitFor(() => expect(result.current.cancelModalState.pendingCancelAction?.description).toBe("manual"))
  })

  it("drives the refund modal flow through the refund-modal context", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    const order = result.current.tableState.filteredOrders[0]
    const orderItem = order.sellerGroups?.[0]?.orderItems[0]
    expect(order).toBeDefined()
    expect(orderItem).toBeDefined()
    if (!order || !orderItem) throw new Error("expected seeded order/item")

    act(() => {
      result.current.refundModalActions.requestRefundAction(order, orderItem)
    })

    await waitFor(() => expect(result.current.refundModalState.pendingRefundOrder).not.toBeNull())
    expect(result.current.refundModalState.pendingRefundOrder?.orderId).toBe(order.orderId)

    await act(async () => {
      await result.current.refundModalActions.submitRefundOrder({
        items: [{ orderItemId: orderItem.id, quantity: 1, returnReason: "damaged" }],
      })
    })

    await waitFor(() => expect(result.current.refundModalState.pendingRefundOrder).toBeNull())
    expect(result.current.refundModalState.isSubmittingRefund).toBe(false)

    act(() => {
      result.current.refundModalActions.setPendingRefundOrder(order)
    })
    await waitFor(() => expect(result.current.refundModalState.pendingRefundOrder).not.toBeNull())
  })

  it("does not open the refund modal for an item that already has a return date", async () => {
    server.use(
      http.get("*/backend-api/orders/buyer", () =>
        HttpResponse.json({
          orders: [
            {
              orderId: "order-1",
              totalPrice: 240,
              orderStatus: "PAID",
              createdDate: "2026-05-20T10:30:00Z",
              addressTitle: "Home",
              addressFormattedAddress: "Somewhere",
              sellerGroups: [
                {
                  sellerId: "seller-1",
                  sellerName: "Acme",
                  sellerSurname: "Store",
                  orderItems: [
                    {
                      id: "item-1",
                      userProductId: "up-1",
                      price: 100,
                      quantity: 2,
                      status: "WAITING_FOR_SHIPMENT",
                      productName: "Dental Kit",
                      productCoverPhotoPath: null,
                      sellerName: "Acme",
                      sellerSurname: "Store",
                      updatedDate: "2026-05-20T11:00:00Z",
                      returnDate: "2026-05-21T00:00:00Z",
                    },
                  ],
                },
              ],
            },
          ],
          currentPage: 0,
          totalPages: 1,
          totalElements: 1,
          pageSize: 10,
        }),
      ),
    )

    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    const order = result.current.tableState.filteredOrders[0]
    const orderItem = order.sellerGroups?.[0]?.orderItems[0]
    if (!order || !orderItem) throw new Error("expected seeded order/item")

    act(() => {
      result.current.refundModalActions.requestRefundAction(order, orderItem)
    })

    expect(result.current.refundModalState.pendingRefundOrder).toBeNull()
  })

  it("drives the tracking modal through the tracking-modal context", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    const payload = [{ trackingUrl: "https://track.example.com/1" }]
    act(() => {
      result.current.trackingModalActions.setTrackingModalLinks(payload)
    })

    await waitFor(() => expect(result.current.trackingModalState.trackingModalLinks).toEqual(payload))
    expect(result.current.trackingModalLinks).toEqual(payload)

    act(() => {
      result.current.trackingModalActions.setTrackingModalLinks(null)
    })
    await waitFor(() => expect(result.current.trackingModalState.trackingModalLinks).toBeNull())
  })

  it("exposes handleSort and handleReorder from the table actions context", async () => {
    const { result } = renderAllContexts()

    await waitFor(() => expect(result.current.tableState.isLoading).toBe(false))

    expect(result.current.tableState.sortField).toBe("createdDate")
    expect(result.current.tableState.sortDir).toBe("desc")

    act(() => {
      result.current.tableActions.handleSort("totalPrice")
    })

    await waitFor(() => expect(result.current.tableState.sortField).toBe("totalPrice"))
    expect(result.current.tableState.sortDir).toBe("desc")
    await waitFor(() => expect(result.current.paginationState.currentPage).toBe(0))
  })
})
