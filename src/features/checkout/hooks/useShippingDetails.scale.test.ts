import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { addressAPI } from "@/lib/api/address"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { makeAddress, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { useShippingDetails } from "./useShippingDetails"

/**
 * Scale check: a cart with 200 distinct vendors (one line each), the case
 * `useShippingDetails`'s `sellerGroups` grouping was written for (per-vendor rate selection).
 * Correctness is asserted; elapsed time is measured and reported, not asserted against a hard
 * ceiling.
 */

vi.mock("@/lib/api/address", () => ({
  addressAPI: {
    getAddresses: vi.fn(),
    getAddress: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}))

const getAddresses = vi.mocked(addressAPI.getAddresses)

const itemFor = (sellerId: string, sellerName: string, userProductId: string) =>
  makeCartItem({
    id: `ci-${userProductId}`,
    quantity: 2,
    userProduct: makeCartUserProduct({ userProductId, sellerId, sellerName }),
    product: makeCartProductInfo({ id: `p-${userProductId}`, name: `Product ${userProductId}` }),
  })

beforeEach(() => {
  vi.restoreAllMocks()
  getAddresses.mockReset()
  getAddresses.mockResolvedValue([makeAddress()])
  useAuthStore.setState({ user: { id: "user-1" } as never })
})

describe("useShippingDetails at 200 vendors", () => {
  it("groups 200 one-line-each vendors into 200 distinct seller groups", async () => {
    const N = 200
    const items = Array.from({ length: N }, (_, i) => itemFor(`seller-${i}`, `Vendor ${i}`, `up-${i}`))
    useCartStore.setState({ cartId: "cart-1", items })

    const start = performance.now()
    const { result } = renderHook(() => useShippingDetails())
    await waitFor(() => expect(result.current.isLoadingAddresses).toBe(false))
    const elapsedMs = performance.now() - start

    const groupIds = Object.keys(result.current.sellerGroups)
    expect(groupIds).toHaveLength(N)
    expect(result.current.sellerGroups["seller-0"]?.items).toHaveLength(1)
    expect(result.current.sellerGroups["seller-199"]?.name).toBe("Vendor 199")

    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(`[scale] useShippingDetails sellerGroups over ${N} vendors: ${elapsedMs.toFixed(2)}ms`)
  })

  it("collapses many lines from the SAME 200 vendors (5 lines each = 1000 items) into 200 groups", async () => {
    const vendorCount = 200
    const linesPerVendor = 5
    const items = Array.from({ length: vendorCount * linesPerVendor }, (_, i) => {
      const vendorIndex = i % vendorCount
      return itemFor(`seller-${vendorIndex}`, `Vendor ${vendorIndex}`, `up-${i}`)
    })
    useCartStore.setState({ cartId: "cart-1", items })

    const start = performance.now()
    const { result } = renderHook(() => useShippingDetails())
    await waitFor(() => expect(result.current.isLoadingAddresses).toBe(false))
    const elapsedMs = performance.now() - start

    const groupIds = Object.keys(result.current.sellerGroups)
    expect(groupIds).toHaveLength(vendorCount)
    for (const id of groupIds) {
      expect(result.current.sellerGroups[id]?.items).toHaveLength(linesPerVendor)
    }

    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(
      `[scale] useShippingDetails sellerGroups over ${vendorCount} vendors x ${linesPerVendor} lines (${items.length} items): ${elapsedMs.toFixed(2)}ms`,
    )
  })
})
