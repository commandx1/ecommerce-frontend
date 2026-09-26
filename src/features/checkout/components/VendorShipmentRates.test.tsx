import { waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ShipmentRate, UberQuote } from "@/lib/api/shipment"
import { shipmentAPI } from "@/lib/api/shipment"
import { render, screen } from "@/test/render"
import VendorShipmentRates from "./VendorShipmentRates"

/**
 * C axis: `rate.servicelevel` (and every field inside it) can genuinely be null for a real
 * Shippo rate — `ShipmentService.mapToRateResponse` (ecommerce-api) only builds the nested object
 * when `rate.servicelevel()` is present, and even then every field comes off `.orElse(null)`.
 * Before this fix, `!rate.servicelevel.name.includes(...)` ran unguarded on every rate returned
 * from the network, so one carrier rate missing that metadata threw and blanked the entire
 * vendor's shipping section (F77/F83's pattern, applied here).
 */

vi.mock("@/lib/api/shipment", () => ({
  shipmentAPI: { getRates: vi.fn() },
}))

const getRates = vi.mocked(shipmentAPI.getRates)

let counter = 0

function uniqueIds() {
  counter += 1
  return { addressId: `addr-${counter}`, cartId: `cart-${counter}`, sellerId: `seller-${counter}` }
}

function makeShippoRate(overrides: Partial<ShipmentRate> = {}): ShipmentRate {
  return {
    objectId: "rate-1",
    provider: "USPS",
    providerImage75: "",
    providerImage200: "",
    amount: "10.00",
    currency: "USD",
    amountLocal: "10.00",
    currencyLocal: "USD",
    arrivesBy: null,
    durationTerms: "2-3 business days",
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
  }
}

function makeUberQuote(overrides: Partial<UberQuote> = {}): UberQuote {
  return {
    kind: "delivery_quote",
    id: "uber-1",
    created: "2026-08-28T00:00:00Z",
    expires: "2026-08-28T00:30:00Z",
    fee: 1500,
    currency: "USD",
    currency_type: "iso_4217",
    dropoff_eta: "2026-08-28T01:00:00Z",
    duration: 45,
    pickup_duration: 10,
    dropoff_deadline: "2026-08-28T01:30:00Z",
    ...overrides,
  }
}

const items = [{ userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 2, shipmentFee: 0 }]

beforeEach(() => {
  vi.restoreAllMocks()
  getRates.mockReset()
})

describe("VendorShipmentRates — malformed servicelevel (C axis)", () => {
  it.each([
    ["the whole servicelevel object is null", { servicelevel: null } as Partial<ShipmentRate>],
    [
      "servicelevel is present but every field inside it is null",
      {
        servicelevel: { name: null, token: null, terms: null, extendedToken: null, parentServicelevel: null },
      } as Partial<ShipmentRate>,
    ],
  ])("renders the rate instead of crashing when %s", async (_label, overrides) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate(overrides)],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // No crash: the vendor's shipping card renders with a usable fallback label instead of a
    // blank/error state, and the rate is still selectable (money-critical — a rate the frontend
    // can't classify must not silently disappear from checkout).
    await waitFor(() => expect(screen.getByText("Shipping option")).toBeInTheDocument())
    expect(screen.queryByText("Failed to fetch shipping rates")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-1" }),
        expect.any(Number),
      ),
    )
  })

  it("still excludes a real Air/Ground service level by name", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({
          objectId: "rate-ground",
          servicelevel: {
            name: "USPS Ground Advantage",
            token: "usps_ground_advantage",
            terms: "",
            extendedToken: "",
            parentServicelevel: null,
          },
        }),
      ],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // Nothing left to auto-select and nothing rendered for the excluded rate — confirms the null-
    // safety fix did not widen the filter to let Ground/Air rates back in.
    await waitFor(() => expect(getRates).toHaveBeenCalled())
    expect(screen.queryByText("USPS Ground Advantage")).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("keeps a rate with a real service level name selectable and labeled", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate()],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText("Priority Mail")).toBeInTheDocument())
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-1" }),
        expect.any(Number),
      ),
    )
  })
})

describe("VendorShipmentRates — no response caching (always fetches fresh)", () => {
  it("sends a brand new network request every time the card is mounted with the exact same inputs", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({ shippoRates: [makeShippoRate({ objectId: "rate-1" })], uberQuote: null })
    const onSelect = vi.fn()

    const first = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(1))
    first.unmount()

    // Same seller/address/cart/items as above, remounted after the first request already
    // settled — there is no cache left to serve, so this must be a second real network call.
    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(2))
  })

  it("does not reuse another vendor/address/cart's rates — every card always asks the network", async () => {
    const base = uniqueIds()
    const varied = { ...base, sellerId: `${base.sellerId}-b` }

    getRates.mockResolvedValue({ shippoRates: [makeShippoRate()], uberQuote: null })
    const onSelect = vi.fn()

    const first = render(
      <VendorShipmentRates
        sellerId={base.sellerId}
        sellerName="Vendor A"
        items={items}
        addressId={base.addressId}
        cartId={base.cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(1))
    first.unmount()

    render(
      <VendorShipmentRates
        sellerId={varied.sellerId}
        sellerName="Vendor B"
        items={items}
        addressId={varied.addressId}
        cartId={varied.cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(2))
  })

  it("refetches when a quantity changes and shows the new rates instead of the old ones", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-qty-2", amount: "10.00" })],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    const { rerender } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() => expect(screen.getByText("$10.00")).toBeInTheDocument())
    expect(getRates).toHaveBeenCalledTimes(1)

    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-qty-5", amount: "22.00" })],
      uberQuote: null,
    })
    const changedQuantityItems = [{ ...items[0]!, quantity: 5 }]

    rerender(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={changedQuantityItems}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByText("$22.00")).toBeInTheDocument())
    expect(screen.queryByText("$10.00")).not.toBeInTheDocument()
  })
})

describe("VendorShipmentRates — stale selection is replaced on refetch", () => {
  it("auto-selects the cheapest rate when the previously selected id is missing from a refetch", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-old", amount: "10.00" })],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    const { rerender } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-old" }),
        expect.any(Number),
      ),
    )
    onSelect.mockClear()

    // Simulate the parent adopting the auto-selected rate, then the cart changing (new address)
    // in a way that drops "rate-old" from the response entirely.
    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-new-cheap", amount: "4.00" })],
      uberQuote: null,
    })

    rerender(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={`${addressId}-new`}
        cartId={cartId}
        onSelect={onSelect}
        selectedRateId="rate-old"
      />,
    )

    // "rate-old" no longer exists in the fresh response — it must not silently ride along into
    // the order. The cheapest available rate is auto-selected in its place.
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-new-cheap" }),
        expect.any(Number),
      ),
    )
  })

  it("re-selects the same rate with its updated amount when a refetch changes the price", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-1", amount: "10.00" })],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    const { rerender } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-1", amount: "10.00" }),
        expect.any(Number),
      ),
    )
    onSelect.mockClear()

    // Same rate id comes back from the refetch, but the carrier price moved.
    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-1", amount: "18.00" })],
      uberQuote: null,
    })

    rerender(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={`${cartId}-new`}
        onSelect={onSelect}
        selectedRateId="rate-1"
      />,
    )

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-1", amount: "18.00" }),
        expect.any(Number),
      ),
    )
  })

  it("does not call onSelect again when a refetch returns the same selected rate at the same price", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-1", amount: "10.00" })],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    const { rerender } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "rate-1" }),
        expect.any(Number),
      ),
    )
    onSelect.mockClear()

    getRates.mockResolvedValueOnce({
      shippoRates: [makeShippoRate({ objectId: "rate-1", amount: "10.00" })],
      uberQuote: null,
    })

    rerender(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={`${cartId}-new`}
        onSelect={onSelect}
        selectedRateId="rate-1"
      />,
    )

    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(2))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe("VendorShipmentRates — outgoing request payload (A axis)", () => {
  it("sends the exact addressId/userId/cartId/parcels payload the backend expects", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    const twoItems = [
      { userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 2, shipmentFee: 0 },
      { userProductId: "up-2", productId: "prod-2", name: "Gadget", quantity: 7, shipmentFee: 0 },
    ]
    getRates.mockResolvedValue({ shippoRates: [makeShippoRate()], uberQuote: null })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={twoItems}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() =>
      expect(getRates).toHaveBeenCalledWith({
        addressId,
        userId: sellerId,
        cartId,
        parcels: [
          { userProductId: "up-1", quantity: 2 },
          { userProductId: "up-2", quantity: 7 },
        ],
      }),
    )
  })
})

describe("VendorShipmentRates — rate selection and pricing", () => {
  it("auto-selects the cheapest shippo rate among several", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "expensive", amount: "20.00" }),
        makeShippoRate({ objectId: "cheapest", amount: "5.00" }),
        makeShippoRate({ objectId: "middle", amount: "15.00" }),
      ],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "cheapest" }),
        expect.any(Number),
      ),
    )
    // Rendered options are also sorted cheapest-first.
    const radios = await screen.findAllByRole("radio")
    expect(radios[0]).toHaveAttribute("name", `shipment-${sellerId}`)
    expect(screen.getByText("$5.00")).toBeInTheDocument()
  })

  it("prefers a cheaper Uber quote over the cheapest shippo rate", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "shippo-rate", amount: "20.00" })],
      uberQuote: makeUberQuote({ fee: 500 }), // $5.00
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ kind: "delivery_quote" }),
        expect.any(Number),
      ),
    )
    expect(screen.getByText("Uber Direct")).toBeInTheDocument()
  })

  it("keeps the cheapest shippo rate selected when the Uber quote is more expensive", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "shippo-rate", amount: "5.00" })],
      uberQuote: makeUberQuote({ fee: 5000 }), // $50.00
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "shippo-rate" }),
        expect.any(Number),
      ),
    )
  })

  it("caps the displayed and selected price at the flat default fee when it undercuts the carrier rate", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "expensive-carrier", amount: "40.00" })],
      uberQuote: null,
      defaultShipmentFee: 25,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText("$25.00")).toBeInTheDocument())
    expect(screen.queryByText(/Great deal/)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(sellerId, expect.objectContaining({ amount: "25.00" }), expect.any(Number)),
    )
  })

  it("shows a Great deal badge with the correct discount when the carrier rate undercuts the plain shipment fee", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    // quantity 1 * shipmentFee 25 => vendorShipmentFee 25 (heavy excluded; there is none here).
    const itemsWithFee = [{ userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 1, shipmentFee: 25 }]
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "cheap-carrier", amount: "10.00" })],
      uberQuote: null,
      defaultShipmentFee: 25,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={itemsWithFee}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText(/Great deal: \$15\.00 shipping discount/)).toBeInTheDocument())
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(sellerId, expect.objectContaining({ amount: "10.00" }), expect.any(Number)),
    )
  })

  /**
   * The boundary itself. `isGreatDeal` is `methodAmount < vendorShipmentFee` (the plain product
   * shipment fee, heavy surcharge excluded — NOT `defaultShipmentFee`, which is a backend price
   * ceiling used to cap the displayed/selected price, not a discountable fee, even though it
   * happens to be the same plain-fee figure). A carrier rate that exactly equals
   * the plain fee is NOT a deal - there is nothing to discount. Getting this wrong invents a
   * "$0.00 shipping discount" badge on an ordinary rate. `defaultShipmentFee` is varied
   * independently here to confirm the badge truly never looks at it (only the displayed/capped
   * price does).
   */
  it.each([
    ["under the plain fee", "10.00", 25, true, "$10.00"],
    ["exactly the plain fee", "25.00", 25, false, "$25.00"],
    ["over the plain fee", "40.00", 25, false, "$25.00"],
    // `undefined`, not null: the API type is `defaultShipmentFee?: number`, so "no flat fee"
    // reaches the component as an absent field. The badge still fires off `vendorShipmentFee`
    // regardless — it never depended on `defaultShipmentFee` being present.
    ["with no flat fee at all", "10.00", undefined, true, "$10.00"],
  ])("carrier rate %s: deal badge %s", async (_label, amount, defaultShipmentFee, expectsBadge, expectedPrice) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    // quantity 1 * shipmentFee 25 => vendorShipmentFee 25, independent of `defaultShipmentFee`.
    const itemsWithFee = [{ userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 1, shipmentFee: 25 }]
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "rate-boundary", amount })],
      uberQuote: null,
      defaultShipmentFee,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={itemsWithFee}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText(expectedPrice)).toBeInTheDocument())
    if (expectsBadge) {
      expect(screen.getByText(/Great deal:/)).toBeInTheDocument()
    } else {
      expect(screen.queryByText(/Great deal:/)).not.toBeInTheDocument()
    }
  })

  /**
   * Uber's fee arrives in cents and is divided by 100 for display. A wrong guard here shows the
   * buyer a $0.00 same-day delivery that is not free, or a price off by two orders of magnitude.
   * `0` is a legitimate fee (a promotion) and renders as "Free" - not "$0.00" and not as a
   * missing price.
   */
  it.each([
    ["a normal fee", 1500, "$15.00"],
    ["a zero fee", 0, "Free"],
    ["a sub-dollar fee", 45, "$0.45"],
  ])("renders the Uber quote price for %s", async (_label, fee, expected) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [],
      uberQuote: makeUberQuote({ fee }),
      defaultShipmentFee: undefined,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument())
  })

  // The discount figure is `vendorShipmentFee - methodAmount` (the plain product shipment fee,
  // heavy surcharge excluded). If that arithmetic drifts the badge advertises a saving the buyer
  // is not getting.
  it.each([
    ["25.00", 40, "$15.00"],
    ["10.00", 12.5, "$2.50"],
    ["0.00", 25, "$25.00"],
  ])("prices the discount as fee minus carrier rate (%s vs %s)", async (amount, vendorFee, expected) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    // quantity 1 so the per-item shipmentFee IS the vendorShipmentFee, matching the old
    // `defaultShipmentFee` fixture values 1:1.
    const itemsWithFee = [
      { userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 1, shipmentFee: vendorFee },
    ]
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "rate-discount", amount })],
      uberQuote: null,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={itemsWithFee}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() =>
      expect(screen.getByText(new RegExp(`Great deal: \\${expected} shipping discount`))).toBeInTheDocument(),
    )
  })

  it("shows no badge when the carrier rate is at or above the plain shipment fee", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    const itemsWithFee = [{ userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 1, shipmentFee: 10 }]
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "rate-no-deal", amount: "10.00" })],
      uberQuote: null,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={itemsWithFee}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText("$10.00")).toBeInTheDocument())
    expect(screen.queryByText(/Great deal:/)).not.toBeInTheDocument()
  })

  it("shows no badge when the vendor's plain shipment fee is zero", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    const itemsWithFee = [{ userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 1, shipmentFee: 0 }]
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "rate-free-vendor-fee", amount: "5.00" })],
      uberQuote: null,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={itemsWithFee}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText("$5.00")).toBeInTheDocument())
    expect(screen.queryByText(/Great deal:/)).not.toBeInTheDocument()
  })

  // Regression guard: the price cap must stay pinned to `defaultShipmentFee` (the backend's
  // plain-fee ceiling, which can legitimately be much larger than the per-item fee sent to this
  // component) even though the badge base (`vendorShipmentFee`, heavy excluded) is much smaller.
  it("keeps the displayed/selected price capped at defaultShipmentFee while showing no badge, when defaultShipmentFee is far above vendorShipmentFee", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    // vendorShipmentFee = 5 (plain fee only, computed client-side); defaultShipmentFee = 30 (the
    // backend's plain-fee ceiling for this fixture); the carrier rate (50) sits above
    // defaultShipmentFee and so gets capped down to it — the same capping behavior as before this
    // change, unaffected by the badge base moving.
    const itemsWithFee = [{ userProductId: "up-1", productId: "prod-1", name: "Widget", quantity: 1, shipmentFee: 5 }]
    const onSelect = vi.fn()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "rate-capped", amount: "50.00" })],
      uberQuote: null,
      defaultShipmentFee: 30,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={itemsWithFee}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // Capped at defaultShipmentFee (30), not the raw carrier rate (50) and not vendorShipmentFee
    // (5) — and no badge, since the raw carrier rate (50) is nowhere near vendorShipmentFee.
    await waitFor(() => expect(screen.getByText("$30.00")).toBeInTheDocument())
    expect(screen.queryByText(/Great deal:/)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(sellerId, expect.objectContaining({ amount: "30.00" }), expect.any(Number)),
    )
  })

  it("renders all shippo rates in ascending price order, not fetch order", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "expensive", amount: "20.00" }),
        makeShippoRate({ objectId: "cheapest", amount: "5.00" }),
        makeShippoRate({ objectId: "middle", amount: "15.00" }),
      ],
      uberQuote: null,
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(3))
    const prices = screen.getAllByText(/^\$\d+\.\d{2}$/).map((el) => el.textContent)
    expect(prices).toEqual(["$5.00", "$15.00", "$20.00"])
  })

  it("merges shippo rates and an Uber quote into a single ascending-price list", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "shippo-mid", amount: "8.00" }),
        makeShippoRate({ objectId: "shippo-high", amount: "20.00" }),
      ],
      uberQuote: makeUberQuote({ fee: 500 }), // $5.00 — should sort first
    })

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(3))
    const prices = screen.getAllByText(/^\$\d+\.\d{2}$/).map((el) => el.textContent)
    expect(prices).toEqual(["$5.00", "$8.00", "$20.00"])
    expect(screen.getByText("Uber Direct")).toBeInTheDocument()
  })

  it("does not let a tied Uber fee beat an equally-priced shippo rate (strict comparison)", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "shippo-rate", amount: "10.00" })],
      uberQuote: makeUberQuote({ fee: 1000 }), // exactly $10.00, tied with the shippo rate
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // A tie must not be treated as "Uber is cheaper" — the comparison is strictly-less-than, so
    // the shippo rate (evaluated first in the fallback) keeps its spot.
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "shippo-rate" }),
        expect.any(Number),
      ),
    )
  })

  it.each([
    ["negative (a corrupt fee, e.g. a refund misapplied upstream)", -500],
    ["NaN-producing", Number.NaN],
  ])("never lets an unusable Uber fee (%s) win over a valid shippo rate", async (_label, fee) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "shippo-rate", amount: "10.00" })],
      uberQuote: makeUberQuote({ fee }),
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "shippo-rate" }),
        expect.any(Number),
      ),
    )
  })

  it("treats a genuinely free ($0) Uber fee as a valid, winning quote — not as an unusable one", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "shippo-rate", amount: "10.00" })],
      uberQuote: makeUberQuote({ fee: 0 }),
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // A promotional $0 Uber fee is real money-relevant information — it must win against a paid
    // shippo rate exactly like any other cheaper quote would, not be excluded as "invalid".
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ kind: "delivery_quote" }),
        expect.any(Number),
      ),
    )
  })

  it("does not silently override an already-selected rate on re-fetch", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "cheaper-alternative", amount: "3.00" }),
        makeShippoRate({ objectId: "already-selected", amount: "10.00" }),
      ],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
        selectedRateId="already-selected"
      />,
    )

    // A cheaper option exists, but the buyer already chose one — auto-select must not silently
    // swap their choice out from under them once data (re)loads.
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("auto-selects the Uber quote when it is the only option (no shippo rates at all)", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [],
      uberQuote: makeUberQuote({ fee: 1200 }),
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ kind: "delivery_quote" }),
        expect.any(Number),
      ),
    )
  })
})

describe("VendorShipmentRates — selection visual state", () => {
  it.each([
    ["a shippo rate", "shippo-selected"],
    ["the Uber quote", "uber-1"],
  ])("highlights only %s when it is the selected option", async (_label, selectedRateId) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "shippo-selected", amount: "10.00" })],
      uberQuote: makeUberQuote({ fee: 5000 }), // deliberately pricier, so it never wins auto-select
    })

    const { container } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
        selectedRateId={selectedRateId}
      />,
    )

    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2))
    const labels = Array.from(container.querySelectorAll("label"))
    const selectedLabel = labels.find((label) => label.querySelector(`input[type="radio"]`)?.matches(":checked"))
    const unselectedLabel = labels.find((label) => label !== selectedLabel)
    if (!selectedLabel || !unselectedLabel) throw new Error("expected exactly one selected and one unselected label")

    // "border-brand" alone is ambiguous — the base class every label carries includes
    // "hover:border-brand/50" — so assert on "bg-accent", which only the selected branch adds.
    expect(selectedLabel.className).toContain("bg-accent")
    expect(selectedLabel.querySelector(".lucide-check")).not.toBeNull()
    expect((selectedLabel.querySelector('input[type="radio"]') as HTMLInputElement).checked).toBe(true)

    expect(unselectedLabel.className).not.toContain("bg-accent")
    expect(unselectedLabel.className).toContain("border-border-soft")
    expect(unselectedLabel.querySelector(".lucide-check")).toBeNull()
    expect((unselectedLabel.querySelector('input[type="radio"]') as HTMLInputElement).checked).toBe(false)
  })
})

describe("VendorShipmentRates — manual selection (click)", () => {
  it("calls onSelect with the normalized rate when the buyer clicks a different shippo option", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "auto-picked", amount: "5.00" }),
        makeShippoRate({ objectId: "manually-picked", amount: "15.00" }),
      ],
      uberQuote: null,
    })
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // Wait for the cheapest to auto-select first, then act as the buyer manually overriding it.
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "auto-picked" }),
        expect.any(Number),
      ),
    )
    onSelect.mockClear()

    const radios = await screen.findAllByRole("radio")
    await user.click(radios[1]!)

    expect(onSelect).toHaveBeenCalledWith(
      sellerId,
      expect.objectContaining({ objectId: "manually-picked", amount: "15.00" }),
      expect.any(Number),
    )
  })

  it('clicking a genuinely free ($0) rate reports a normalized "0.00" amount, not the raw wire value', async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "free-rate", amount: "0" })],
      uberQuote: null,
    })
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    onSelect.mockClear()
    const radio = await screen.findByRole("radio")
    await user.click(radio)

    expect(onSelect).toHaveBeenCalledWith(
      sellerId,
      expect.objectContaining({ objectId: "free-rate", amount: "0.00" }),
      expect.any(Number),
    )
  })

  /**
   * A rate whose amount we cannot trust is not offered at all. It used to be rendered (sorted last
   * as "infinitely expensive"), which meant `formatCurrency` floored the non-finite value to 0 and
   * the buyer was shown "$0.00" - free shipping - on a rate whose real amount was garbage or
   * negative; selecting it fed that raw value into the order total.
   */
  it("does not offer a rate whose amount is unusable, so it can never be priced or selected", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "good-amount", amount: "12.00" }),
        makeShippoRate({ objectId: "bad-amount", amount: "not-a-number" }),
      ],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // Only the usable rate is offered; the unusable one is absent entirely.
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(1))
    expect(screen.getByText("$12.00")).toBeInTheDocument()
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument()

    // And it is the usable rate that gets auto-selected, never the untrusted one.
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "good-amount" }),
        expect.any(Number),
      ),
    )
    for (const [, reportedRate] of onSelect.mock.calls as [string, ShipmentRate][]) {
      expect(reportedRate.objectId).not.toBe("bad-amount")
    }
  })
})

describe("VendorShipmentRates — error, empty and loading states", () => {
  it("shows a visible error and never calls onSelect when the request fails", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockRejectedValue(new Error("network down"))
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText("Failed to fetch shipping rates")).toBeInTheDocument())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("renders no crash and no selection when the vendor has no shipping options at all", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({ shippoRates: [], uberQuote: null })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(getRates).toHaveBeenCalled())
    expect(screen.queryByText("Failed to fetch shipping rates")).not.toBeInTheDocument()
    expect(screen.queryByRole("radio")).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("shows a skeleton (no options, no error) while the request is still pending", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    let resolveRates: (value: { shippoRates: ShipmentRate[]; uberQuote: null }) => void = () => {}
    getRates.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRates = resolve
        }),
    )
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    expect(screen.queryByText(/Shipping from:/)).not.toBeInTheDocument()
    expect(screen.queryByText("Failed to fetch shipping rates")).not.toBeInTheDocument()

    resolveRates({ shippoRates: [makeShippoRate()], uberQuote: null })
    await waitFor(() => expect(screen.getByText(/Shipping from:/)).toBeInTheDocument())
  })

  it.each([
    ["no cart items for this vendor", { items: [] as typeof items }],
    ["no addressId yet (checkout address not chosen)", { addressId: "" }],
    ["no cartId yet", { cartId: "" }],
  ])("does not fetch and does not get stuck on a skeleton/error when there is %s", async (_label, override) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
        {...override}
      />,
    )

    expect(getRates).not.toHaveBeenCalled()
    // If `isLoading`/`hasError` ever defaulted to anything other than false, a vendor with no
    // fetchable state would be stuck showing the skeleton or the error forever, since nothing here
    // ever runs to flip those flags back.
    expect(screen.getByText(/Shipping from:/)).toBeInTheDocument()
    expect(screen.queryByText("Failed to fetch shipping rates")).not.toBeInTheDocument()
  })

  it("does not update state (and does not warn) when the component unmounts before the fetch resolves", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    let resolveRates: (value: { shippoRates: ShipmentRate[]; uberQuote: null }) => void = () => {}
    getRates.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRates = resolve
        }),
    )

    const { unmount } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={vi.fn()}
      />,
    )

    unmount()
    resolveRates({ shippoRates: [makeShippoRate()], uberQuote: null })
    // Flush the microtask queue the resolved promise schedules work on.
    await Promise.resolve()
    await Promise.resolve()

    // React warns loudly ("Can't perform a state update on an unmounted component") if the
    // `isMounted` guard is bypassed — that warning is the only observable signature of this race.
    const unmountWarning = consoleError.mock.calls.some((call) =>
      String(call[0]).includes("Can't perform a React state update on an unmounted component"),
    )
    expect(unmountWarning).toBe(false)
  })

  it("refetches when the shipping address changes on an already-mounted card", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({ shippoRates: [makeShippoRate()], uberQuote: null })
    const onSelect = vi.fn()

    const { rerender } = render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )
    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(1))

    // Same component instance, same seller/cart/items — only the shipping address changed. Stale
    // rates for the old address must not keep being shown.
    rerender(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={`${addressId}-new`}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(getRates).toHaveBeenCalledTimes(2))
  })
})

describe("VendorShipmentRates — adversarial rate data (C axis)", () => {
  it("degrades to the visible error state instead of crashing when shippoRates is not an array", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    // A malformed 200 body — see TEST-FINDINGS.md #26. `shippoRates` is read with `.filter`
    // straight off the response; a non-array here must not blank the whole checkout tree.
    getRates.mockResolvedValue({
      shippoRates: null as unknown as ShipmentRate[],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText("Failed to fetch shipping rates")).toBeInTheDocument())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it.each([
    ["negative", "-10.00"],
    ["non-numeric", "N/A"],
  ])("does not let a %s amount win auto-selection or display a fabricated discount", async (_label, badAmount) => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [
        makeShippoRate({ objectId: "bad-amount", amount: badAmount }),
        makeShippoRate({ objectId: "good-amount", amount: "12.00" }),
      ],
      uberQuote: null,
      defaultShipmentFee: 30,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    // The valid, positively-priced rate must win — not the broken one, even though a raw
    // numeric/string comparison would rank a negative amount as "cheapest".
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "good-amount" }),
        expect.any(Number),
      ),
    )
    expect(screen.queryByText(/Great deal: \$40\.00/)).not.toBeInTheDocument()
    expect(screen.queryByText("-$10.00")).not.toBeInTheDocument()
  })

  it("treats a $0 rate as genuinely free, not as an invalid amount", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "free-rate", amount: "0" })],
      uberQuote: null,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText("Free")).toBeInTheDocument())
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        sellerId,
        expect.objectContaining({ objectId: "free-rate" }),
        expect.any(Number),
      ),
    )
  })

  it("ignores a non-numeric defaultShipmentFee instead of letting it corrupt price comparisons", async () => {
    const { addressId, cartId, sellerId } = uniqueIds()
    getRates.mockResolvedValue({
      shippoRates: [makeShippoRate({ objectId: "rate-1", amount: "10.00" })],
      uberQuote: null,
      // Wrong type from the wire — must fall back to "no flat fee" rather than being coerced.
      defaultShipmentFee: "20" as unknown as number,
    })
    const onSelect = vi.fn()

    render(
      <VendorShipmentRates
        sellerId={sellerId}
        sellerName="Acme Dental"
        items={items}
        addressId={addressId}
        cartId={cartId}
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(screen.getByText("$10.00")).toBeInTheDocument())
    expect(screen.queryByText(/Great deal/)).not.toBeInTheDocument()
  })
})
