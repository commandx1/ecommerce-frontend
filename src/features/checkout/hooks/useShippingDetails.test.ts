import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import type { ShippingRate } from "@/features/checkout/types"
import { addressAPI } from "@/lib/api/address"
import type { ShipmentRate, UberQuote } from "@/lib/api/shipment"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeAddress, makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { useShippingDetails } from "./useShippingDetails"

/**
 * Step 2 of checkout: pick an address, pick one shipping rate per vendor, and turn both into the
 * order payload the backend will price.
 *
 * `@/lib/api/address` is mocked because the real module keeps a 2s module-level response cache
 * with no exported reset — served over MSW it would leak one test's address list into the next.
 * (`@/lib/api/shipment` has the same untestable cache, but the rate *fetch* lives in
 * `VendorShipmentRates`, not in this hook — the hook only receives an already-fetched rate.)
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

const makeShippoRate = (overrides: Partial<ShipmentRate> = {}): ShipmentRate => ({
  objectId: "rate-shippo-1",
  provider: "USPS",
  providerImage75: "",
  providerImage200: "",
  amount: "12.50",
  currency: "USD",
  amountLocal: "12.50",
  currencyLocal: "USD",
  arrivesBy: null,
  durationTerms: "",
  estimatedDays: 3,
  attributes: [],
  servicelevel: {
    name: "Priority Mail",
    token: "usps_priority",
    terms: "",
    extendedToken: "",
    parentServicelevel: null,
  },
  test: true,
  ...overrides,
})

const makeUberQuote = (overrides: Partial<UberQuote> = {}): UberQuote => ({
  kind: "delivery_quote",
  id: "quote-uber-1",
  created: "2026-08-22T10:00:00Z",
  expires: "2026-08-22T10:15:00Z",
  fee: 1899,
  currency: "usd",
  currency_type: "usd",
  dropoff_eta: "2026-08-22T12:00:00Z",
  duration: 45,
  pickup_duration: 10,
  dropoff_deadline: "2026-08-22T13:00:00Z",
  ...overrides,
})

const itemFor = (sellerId: string, sellerName: string, userProductId: string, autoOrder = null as null | "ONE_MONTH") =>
  makeCartItem({
    id: `ci-${userProductId}`,
    quantity: 2,
    autoOrder,
    userProduct: makeCartUserProduct({ userProductId, sellerId, sellerName }),
    product: makeCartProductInfo({ id: `p-${userProductId}`, name: `Product ${userProductId}` }),
  })

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent

/** Mounts the hook and waits for the address fetch to have settled. */
const mountHook = async () => {
  const rendered = renderHook(() => useShippingDetails())
  await waitFor(() => expect(rendered.result.current.isLoadingAddresses).toBe(false))
  return rendered
}

beforeEach(() => {
  // Restore spies first: `restoreAllMocks` also resets the module mock's implementation, so it
  // has to run before `getAddresses` is armed for this test.
  vi.restoreAllMocks()
  getAddresses.mockReset()
  getAddresses.mockResolvedValue([makeAddress()])
  useCartStore.setState({ cartId: "cart-1", items: [itemFor("seller-1", "Acme Dental", "up-1")] })
  useAuthStore.setState({ user: { id: "user-1" } as never })
})

describe("useShippingDetails — address selection", () => {
  it("selects the address flagged as default and copies it into the checkout store", async () => {
    getAddresses.mockResolvedValue([
      makeAddress({ id: "address-a", defaultAddress: false, fullName: "Not Chosen" }),
      makeAddress({
        id: "address-b",
        defaultAddress: true,
        fullName: "Serhat Kaan Belen",
        title: "Clinic HQ",
        addressLine: "1 Main St",
        city: "Boston",
        state: "MA",
        postalCode: "02110",
        phoneNumber: "+15550001111",
      }),
    ])

    const { result } = await mountHook()

    expect(result.current.selectedAddressId).toBe("address-b")
    expect(useCheckoutStore.getState().shippingAddress).toMatchObject({
      firstName: "Serhat",
      lastName: "Kaan Belen",
      company: "Clinic HQ",
      street: "1 Main St",
      city: "Boston",
      state: "MA",
      zipCode: "02110",
      phone: "+15550001111",
    })
  })

  it("falls back to the first address when none is marked default", async () => {
    getAddresses.mockResolvedValue([
      makeAddress({ id: "address-a", defaultAddress: false }),
      makeAddress({ id: "address-b", defaultAddress: false }),
    ])

    const { result } = await mountHook()

    expect(result.current.selectedAddressId).toBe("address-a")
  })

  it("selects nothing when the buyer has no addresses yet", async () => {
    getAddresses.mockResolvedValue([])

    const { result } = await mountHook()

    expect(result.current.addresses).toEqual([])
    expect(result.current.selectedAddressId).toBe("")
  })

  it("surfaces a load failure instead of hanging on the spinner", async () => {
    const errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
    getAddresses.mockRejectedValue(new Error("boom"))

    const { result } = await mountHook()

    expect(errorToast).toHaveBeenCalledWith("Failed to load addresses")
    expect(result.current.addresses).toEqual([])
  })

  it("routes to the address book when the buyer adds an address", async () => {
    const { result, ...rest } = await mountHook()
    void rest

    act(() => {
      result.current.onAddAddress()
    })

    const { getRouterMock } = await import("@/test/mocks/next-navigation")
    expect(getRouterMock().push).toHaveBeenCalledWith("/buyer-dashboard/settings/addresses")
  })
})

describe("useShippingDetails — vendor grouping", () => {
  it("groups the cart lines by seller", async () => {
    useCartStore.setState({
      items: [
        itemFor("seller-1", "Acme Dental", "up-1"),
        itemFor("seller-2", "Beta Supply", "up-2"),
        itemFor("seller-1", "Acme Dental", "up-3"),
      ],
    })

    const { result } = await mountHook()

    expect(Object.keys(result.current.sellerGroups)).toEqual(["seller-1", "seller-2"])
    expect(result.current.sellerGroups["seller-1"].items.map((item) => item.userProductId)).toEqual(["up-1", "up-3"])
    expect(result.current.sellerGroups["seller-2"].name).toBe("Beta Supply")
  })

  it("falls back to a standard seller label when the line carries no seller", async () => {
    useCartStore.setState({
      items: [
        makeCartItem({
          userProduct: makeCartUserProduct({ userProductId: "up-1", sellerId: "", sellerName: "" }),
        }),
      ],
    })

    const { result } = await mountHook()

    expect(result.current.sellerGroups["Standard Seller"].name).toBe("Standard Seller")
  })
})

describe("useShippingDetails — rate selection", () => {
  it("records a Shippo rate with its dollar amount and business-day ETA", async () => {
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate() as ShippingRate)
    })

    expect(result.current.selectedRates["seller-1"]).toEqual({ type: "shippo", rateId: "rate-shippo-1", amount: 12.5 })
    await waitFor(() => expect(useCheckoutStore.getState().selectedShippingCost).toBe(12.5))
    expect(useCheckoutStore.getState().selectedShippingEtaText).toBe("Priority Mail - 3 business days")
    expect(useCheckoutStore.getState().selectedVendorShippingMethods["seller-1"]).toEqual({
      sellerName: "Acme Dental",
      methodText: "Priority Mail - 3 business days",
      amount: 12.5,
    })
  })

  it("converts an Uber quote's cents fee into dollars", async () => {
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeUberQuote() as ShippingRate)
    })

    expect(result.current.selectedRates["seller-1"]).toEqual({ type: "uber", rateId: "quote-uber-1", amount: 18.99 })
    expect(useCheckoutStore.getState().selectedVendorShippingMethods["seller-1"].methodText).toBe(
      "Same-day delivery - 45 mins",
    )
    await waitFor(() => expect(useCheckoutStore.getState().selectedShippingCost).toBe(18.99))
  })

  it("adds up a mixed Shippo + Uber basket, and leaves a rate-less vendor out of the total", async () => {
    useCartStore.setState({
      items: [
        itemFor("seller-1", "Acme Dental", "up-1"),
        itemFor("seller-2", "Beta Supply", "up-2"),
        // seller-3's rate lookup failed in VendorShipmentRates, so no rate ever reaches the hook
        itemFor("seller-3", "Gamma Labs", "up-3"),
      ],
    })

    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate({ amount: "10.00" }) as ShippingRate)
    })
    act(() => {
      result.current.onRateSelect("seller-2", makeUberQuote({ fee: 500 }) as ShippingRate)
    })

    await waitFor(() => expect(useCheckoutStore.getState().selectedShippingCost).toBe(15))
    // The broken vendor does not corrupt the working ones.
    expect(Object.keys(useCheckoutStore.getState().selectedVendorShippingMethods)).toEqual(["seller-1", "seller-2"])
    expect(result.current.selectedRates["seller-3"]).toBeUndefined()
  })

  it("replaces a vendor's previous rate rather than stacking on top of it", async () => {
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate({ objectId: "rate-a", amount: "30.00" }) as ShippingRate)
    })
    await waitFor(() => expect(useCheckoutStore.getState().selectedShippingCost).toBe(30))

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate({ objectId: "rate-b", amount: "7.25" }) as ShippingRate)
    })

    await waitFor(() => expect(useCheckoutStore.getState().selectedShippingCost).toBe(7.25))
    expect(result.current.selectedRates["seller-1"].rateId).toBe("rate-b")
  })

  it("keeps the same object identity when the identical rate is re-selected", async () => {
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate() as ShippingRate)
    })
    const first = result.current.selectedRates

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate() as ShippingRate)
    })

    expect(result.current.selectedRates).toBe(first)
  })

  /**
   * KNOWN BEHAVIOUR, NOT AN ENDORSEMENT: switching address does NOT clear the rates already
   * chosen for the previous address. The quote was priced for the old destination, so the buyer
   * can reach step 3 carrying a stale shipping price. The backend re-prices from the rate id,
   * which is why this is not (yet) a charge bug — but the summary total can lie.
   */
  it("does NOT invalidate previously selected rates when the address changes", async () => {
    getAddresses.mockResolvedValue([
      makeAddress({ id: "address-a", defaultAddress: true }),
      makeAddress({ id: "address-b", defaultAddress: false, city: "Denver", postalCode: "80202" }),
    ])
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate({ amount: "40.00" }) as ShippingRate)
    })
    await waitFor(() => expect(useCheckoutStore.getState().selectedShippingCost).toBe(40))

    act(() => {
      result.current.onAddressChange(result.current.addresses[1])
    })

    expect(result.current.selectedAddressId).toBe("address-b")
    expect(result.current.selectedRates["seller-1"]).toEqual({ type: "shippo", rateId: "rate-shippo-1", amount: 40 })
    expect(useCheckoutStore.getState().selectedShippingCost).toBe(40)
  })
})

describe("useShippingDetails — submit", () => {
  it("refuses to continue without an address", async () => {
    const errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
    getAddresses.mockResolvedValue([])
    const { result } = await mountHook()

    act(() => {
      result.current.onSubmit(submitEvent())
    })

    expect(errorToast).toHaveBeenCalledWith("Please select a shipping address")
    expect(useCheckoutStore.getState().orderPayload).toBeNull()
    expect(useCheckoutStore.getState().currentStep).toBe(1)
  })

  it("refuses to continue when no vendor has a shipping method", async () => {
    const errorToast = vi.spyOn(showToast, "error").mockImplementation(() => undefined)
    const { result } = await mountHook()

    act(() => {
      result.current.onSubmit(submitEvent())
    })

    expect(errorToast).toHaveBeenCalledWith("Please select at least one shipping method")
    expect(useCheckoutStore.getState().orderPayload).toBeNull()
  })

  it("builds separate shippo and uber orders, carrying the recurrence per line", async () => {
    useCartStore.setState({
      items: [itemFor("seller-1", "Acme Dental", "up-1", "ONE_MONTH"), itemFor("seller-2", "Beta Supply", "up-2")],
    })
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate({ objectId: "rate-x" }) as ShippingRate)
    })
    act(() => {
      result.current.onRateSelect("seller-2", makeUberQuote({ id: "quote-y" }) as ShippingRate)
    })
    act(() => {
      result.current.onSubmit(submitEvent())
    })

    expect(useCheckoutStore.getState().orderPayload).toEqual({
      addressId: "address-1",
      shippoRateOrders: [
        {
          shippoRateId: "rate-x",
          userId: "seller-1",
          products: [{ userProductId: "up-1", quantity: 2, autoOrder: "ONE_MONTH" }],
        },
      ],
      uberRateOrders: [
        {
          uberRateId: "quote-y",
          userId: "seller-2",
          products: [{ userProductId: "up-2", quantity: 2, autoOrder: null }],
        },
      ],
    })
    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("submits only the vendors that actually have a rate", async () => {
    useCartStore.setState({
      items: [itemFor("seller-1", "Acme Dental", "up-1"), itemFor("seller-2", "Beta Supply", "up-2")],
    })
    const { result } = await mountHook()

    act(() => {
      result.current.onRateSelect("seller-1", makeShippoRate() as ShippingRate)
    })
    act(() => {
      result.current.onSubmit(submitEvent())
    })

    const payload = useCheckoutStore.getState().orderPayload
    expect(payload?.shippoRateOrders).toHaveLength(1)
    expect(payload?.uberRateOrders).toHaveLength(0)
  })
})

describe("useShippingDetails — auto order address notice", () => {
  it("stays quiet when nothing in the cart repeats", async () => {
    const { result } = await mountHook()

    expect(result.current.showAutoOrderAddressNotice).toBe(false)
  })

  it("stays quiet when the repeat order ships to the primary address", async () => {
    useCartStore.setState({ items: [itemFor("seller-1", "Acme Dental", "up-1", "ONE_MONTH")] })
    getAddresses.mockResolvedValue([makeAddress({ id: "address-1", defaultAddress: true })])

    const { result } = await mountHook()

    expect(result.current.showAutoOrderAddressNotice).toBe(false)
  })

  it("warns when a repeat order is being sent to a non-primary address", async () => {
    useCartStore.setState({ items: [itemFor("seller-1", "Acme Dental", "up-1", "ONE_MONTH")] })
    getAddresses.mockResolvedValue([
      makeAddress({ id: "address-primary", defaultAddress: true }),
      makeAddress({ id: "address-other", defaultAddress: false }),
    ])

    const { result } = await mountHook()
    act(() => {
      result.current.onAddressChange(result.current.addresses[1])
    })

    expect(result.current.showAutoOrderAddressNotice).toBe(true)
  })

  it("warns when there is no primary address at all", async () => {
    useCartStore.setState({ items: [itemFor("seller-1", "Acme Dental", "up-1", "ONE_MONTH")] })
    getAddresses.mockResolvedValue([makeAddress({ id: "address-only", defaultAddress: false })])

    const { result } = await mountHook()

    expect(result.current.showAutoOrderAddressNotice).toBe(true)
  })
})
