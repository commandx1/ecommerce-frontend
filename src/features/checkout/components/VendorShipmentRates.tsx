import { Check, Info, Truck } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { type ShipmentRate, shipmentAPI, type UberQuote } from "@/lib/api/shipment"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface VendorShipmentRatesProps {
  sellerId: string
  sellerName: string
  items: { userProductId: string; productId: string; name: string; quantity: number; shipmentFee: number }[]
  addressId: string
  cartId: string
  onSelect: (sellerId: string, rate: ShipmentRate | UberQuote) => void
  selectedRateId?: string
}

const SHIPPING_RATES_CACHE_KEY_PREFIX = "checkout:shipping-rates:v1"
const SHIPPING_RATES_CACHE_TTL_MS = 15 * 60 * 1000

interface ShippingRatesCacheValue {
  fetchedAt: number
  data: {
    shippoRates: ShipmentRate[]
    uberQuote: UberQuote | null
    defaultShipmentFee: number | null
  }
}

function buildShippingRatesCacheKey(args: {
  addressId: string
  cartId: string
  sellerId: string
  items: { userProductId: string; productId: string; quantity: number }[]
}): string {
  const normalizedItems = [...args.items]
    .sort((a, b) => {
      if (a.userProductId === b.userProductId) {
        if (a.productId === b.productId) {
          return a.quantity - b.quantity
        }
        return a.productId.localeCompare(b.productId)
      }
      return a.userProductId.localeCompare(b.userProductId)
    })
    .map((item) => `${item.userProductId}:${item.productId}:${item.quantity}`)
    .join("|")

  return `${SHIPPING_RATES_CACHE_KEY_PREFIX}:${args.addressId}:${args.cartId}:${args.sellerId}:${normalizedItems}`
}

function readShippingRatesFromCache(cacheKey: string): ShippingRatesCacheValue["data"] | null {
  if (typeof window === "undefined") return null

  // Bug found while testing this file: `getItem`/`JSON.parse`/`removeItem` used to run partly
  // outside this try block. Storage access can throw for reasons that have nothing to do with the
  // network (Safari private browsing, a sandboxed checkout iframe, a full quota) — when it did, the
  // exception propagated up into `fetchRates`'s catch and the user saw "Failed to fetch shipping
  // rates" with no rates and no retry, even though a normal network fetch would have worked fine.
  // A storage failure must degrade to "treat as a cache miss", not to a hard error.
  try {
    const rawValue = window.localStorage.getItem(cacheKey)
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue) as ShippingRatesCacheValue
    if (!parsed?.fetchedAt || !parsed.data) {
      window.localStorage.removeItem(cacheKey)
      return null
    }

    if (Date.now() - parsed.fetchedAt > SHIPPING_RATES_CACHE_TTL_MS) {
      window.localStorage.removeItem(cacheKey)
      return null
    }

    return parsed.data
  } catch {
    try {
      window.localStorage.removeItem(cacheKey)
    } catch {
      // Storage is unusable altogether — nothing left to clean up.
    }
    return null
  }
}

function writeShippingRatesToCache(cacheKey: string, data: ShippingRatesCacheValue["data"]) {
  if (typeof window === "undefined") return

  // Same class of bug as the read path above, but worse: this runs AFTER a successful network
  // fetch. An uncaught `setItem` throw (quota exceeded, private mode, blocked storage) discarded
  // rates the user already has and showed a network-style error for a caching failure. Caching is
  // strictly best-effort — losing it must never lose the rates themselves.
  try {
    const payload: ShippingRatesCacheValue = {
      fetchedAt: Date.now(),
      data,
    }
    window.localStorage.setItem(cacheKey, JSON.stringify(payload))
  } catch {
    // Best-effort cache write; `applyRatesData` still runs with the freshly fetched data.
  }
}

function formatShippingAmount(amount: number): string {
  return amount === 0 ? "Free" : formatCurrency(amount)
}

// `rate.amount` is a raw string off the wire (backend: `ShipmentRateResponse.amount`, sourced from
// Shippo). It can be non-numeric, and for adversarial/malformed data, negative. A negative amount
// is numerically "cheapest", so left unguarded it would win auto-selection and render as a
// nonsensical negative price with a fabricated "Great deal" discount badge (`defaultShipmentFee -
// methodAmount` where methodAmount < 0). Treat it the same as non-numeric: unusable for sorting or
// display, falling through to the existing NaN-safe fallbacks.
function parseRateAmount(rate: ShipmentRate): number {
  const parsed = Number(rate.amount)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN
}

function getEffectiveRateAmount(rate: ShipmentRate, defaultShipmentFee: number | null): number {
  const methodAmount = parseRateAmount(rate)
  if (!Number.isFinite(methodAmount)) return Number.POSITIVE_INFINITY
  if (defaultShipmentFee !== null && defaultShipmentFee < methodAmount) return defaultShipmentFee
  return methodAmount
}

// Backend: `rate.servicelevel` and every string field inside it can be null for a real Shippo
// carrier rate (see the `ShipmentRate` type comment in `lib/api/shipment.ts`) — this used to be
// `rate.servicelevel.name.includes(...)` with no guard, so a single rate with no service level
// metadata threw and blanked the whole vendor's shipping section (matches F77/F83's pattern: an
// unguarded read of a field the backend can legitimately omit). Unable to classify (no name) is
// treated as "keep the rate" rather than silently dropping a deliverable option.
function isExcludedServiceLevel(rate: ShipmentRate): boolean {
  const name = rate.servicelevel?.name
  if (typeof name !== "string") return false
  return name.includes("Air") || name.includes("Ground")
}

function getUberQuoteAmount(quote: UberQuote): number {
  const amount = quote.fee / 100
  if (!Number.isFinite(amount) || amount < 0) return Number.POSITIVE_INFINITY
  return amount
}

function ShippingRatesSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border-soft bg-surface-muted p-4">
      <div className="mb-4 h-4 w-1/4 rounded bg-surface-elevated" />
      <div className="space-y-3">
        <div className="h-12 rounded bg-surface-elevated" />
        <div className="h-12 rounded bg-surface-elevated" />
      </div>
    </div>
  )
}

function ShippingRatesError() {
  return (
    <div className="flex items-center rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
      <Info className="mr-2 h-4 w-4" />
      Failed to fetch shipping rates
    </div>
  )
}

export default function VendorShipmentRates({
  sellerId,
  sellerName,
  items,
  addressId,
  cartId,
  onSelect,
  selectedRateId,
}: VendorShipmentRatesProps) {
  const [rates, setRates] = useState<ShipmentRate[]>([])
  const [uberQuote, setUberQuote] = useState<UberQuote | null>(null)
  const [defaultShipmentFee, setDefaultShipmentFee] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const selectedRateIdRef = useRef(selectedRateId)
  selectedRateIdRef.current = selectedRateId

  useEffect(() => {
    let isMounted = true

    const applyRatesData = (data: {
      shippoRates: ShipmentRate[]
      uberQuote: UberQuote | null
      defaultShipmentFee: number | null
    }) => {
      const filteredRates = data.shippoRates.filter((rate) => !isExcludedServiceLevel(rate))

      setRates(filteredRates)
      setUberQuote(data.uberQuote)
      setDefaultShipmentFee(data.defaultShipmentFee)

      if (!selectedRateIdRef.current && (filteredRates.length > 0 || data.uberQuote)) {
        const cheapestRate = [...filteredRates].sort(
          (a, b) =>
            getEffectiveRateAmount(a, data.defaultShipmentFee) - getEffectiveRateAmount(b, data.defaultShipmentFee),
        )[0]
        const cheapestRateAmount = cheapestRate
          ? getEffectiveRateAmount(cheapestRate, data.defaultShipmentFee)
          : Number.POSITIVE_INFINITY
        const uberAmount = data.uberQuote ? getUberQuoteAmount(data.uberQuote) : Number.POSITIVE_INFINITY

        if (data.uberQuote && uberAmount < cheapestRateAmount) {
          onSelectRef.current(sellerId, data.uberQuote)
          return
        }

        if (cheapestRate) {
          onSelectRef.current(sellerId, {
            ...cheapestRate,
            amount: cheapestRateAmount.toFixed(2),
          })
        }
      }
    }

    const fetchRates = async () => {
      const parcels = items.map((item) => ({
        userProductId: item.userProductId,
        quantity: item.quantity,
      }))
      const cacheKey = buildShippingRatesCacheKey({
        addressId,
        cartId,
        sellerId,
        items: items.map((item) => ({
          userProductId: item.userProductId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      })

      setIsLoading(true)
      setHasError(false)

      try {
        const cached = readShippingRatesFromCache(cacheKey)
        if (cached) {
          if (!isMounted) return
          applyRatesData(cached)
          return
        }

        const response = await shipmentAPI.getRates({
          addressId,
          userId: sellerId,
          cartId,
          parcels,
        })

        if (!isMounted) return

        const filteredRates = response.shippoRates.filter((rate) => !isExcludedServiceLevel(rate))
        const responseDefaultShipmentFee =
          typeof response.defaultShipmentFee === "number" && Number.isFinite(response.defaultShipmentFee)
            ? response.defaultShipmentFee
            : null

        const dataForCache: ShippingRatesCacheValue["data"] = {
          shippoRates: filteredRates,
          uberQuote: response.uberQuote,
          defaultShipmentFee: responseDefaultShipmentFee,
        }
        writeShippingRatesToCache(cacheKey, dataForCache)
        applyRatesData(dataForCache)
      } catch (_error) {
        if (!isMounted) return
        setHasError(true)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (addressId && cartId && items.length > 0) {
      void fetchRates()
    }

    return () => {
      isMounted = false
    }
  }, [addressId, cartId, items, sellerId])

  // The seller's plain product shipment fee (heavy surcharge EXCLUDED), used only as the "Great
  // deal" badge's comparison base — see the badge computation below for why this must diverge
  // from `defaultShipmentFee`.
  const vendorShipmentFee = useMemo(
    () => items.reduce((sum, item) => sum + (item.shipmentFee ?? 0) * item.quantity, 0),
    [items],
  )

  const sortedRates = useMemo(
    () =>
      [...rates].sort(
        (a, b) => getEffectiveRateAmount(a, defaultShipmentFee) - getEffectiveRateAmount(b, defaultShipmentFee),
      ),
    [rates, defaultShipmentFee],
  )
  const sortedShipmentOptions = useMemo(() => {
    // A rate whose amount is unusable (non-numeric or negative) is DROPPED, not merely sorted
    // last. Keeping it looked safe because `getEffectiveRateAmount` returns Infinity, but the
    // row still rendered - and `formatCurrency` floors a non-finite value to 0, so the buyer saw
    // "$0.00" (free shipping) and could select it, after which `onRateSelect` fed the raw
    // negative `rate.amount` into the order total. A price we cannot trust must not be offered.
    const shippoOptions = sortedRates
      .map((rate) => ({
        type: "shippo" as const,
        id: rate.objectId,
        amount: getEffectiveRateAmount(rate, defaultShipmentFee),
        rate,
      }))
      .filter((option) => Number.isFinite(option.amount))
    const uberOptions = uberQuote
      ? [
          {
            type: "uber" as const,
            id: uberQuote.id,
            amount: getUberQuoteAmount(uberQuote),
            quote: uberQuote,
          },
        ]
      : []

    return [...shippoOptions, ...uberOptions].sort((a, b) => a.amount - b.amount)
  }, [defaultShipmentFee, sortedRates, uberQuote])

  if (isLoading) return <ShippingRatesSkeleton />
  if (hasError) return <ShippingRatesError />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center text-sm font-semibold text-text-secondary">
          <Truck className="mr-2 h-4 w-4 text-brand" />
          Shipping from: <span className="ml-1 text-brand">{sellerName}</span>
        </h4>
        <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-text-muted">
          {items.length} items
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {sortedShipmentOptions.map((option) =>
          (() => {
            if (option.type === "uber") {
              const quote = option.quote
              const displayAmount = Number.isFinite(option.amount) && option.amount >= 0 ? option.amount : 0

              return (
                <label
                  key={quote.id}
                  className={`relative flex cursor-pointer items-center rounded-xl border p-4 transition-all hover:border-brand/50 ${
                    selectedRateId === quote.id
                      ? "border-brand bg-accent ring-1 ring-brand/25"
                      : "border-border-soft bg-surface-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name={`shipment-${sellerId}`}
                    className="sr-only"
                    checked={selectedRateId === quote.id}
                    onChange={() => onSelect(sellerId, quote)}
                  />
                  <div className="flex min-w-0 flex-1 items-center">
                    <div className="mr-3 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">Uber Direct</span>
                        <div className="ml-2 text-right">
                          <div className="font-bold text-brand">{formatShippingAmount(displayAmount)}</div>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-text-muted">Same-day delivery</span>
                        <span className="text-xs font-medium text-success">{quote.duration} mins</span>
                      </div>
                    </div>
                  </div>
                  {selectedRateId === quote.id ? (
                    <div className="absolute top-2 right-2 rounded-full bg-brand p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : null}
                </label>
              )
            }

            const rate = option.rate
            const methodAmount = parseRateAmount(rate)
            const effectiveAmount =
              defaultShipmentFee !== null && Number.isFinite(methodAmount) && defaultShipmentFee < methodAmount
                ? defaultShipmentFee
                : methodAmount
            // Backend: `defaultShipmentFee` bundles the heavy shipping surcharge on top of the
            // plain product shipment fee (ShipmentService.java:493-513) — it's a price ceiling
            // used to cap what the buyer can be charged, not a discountable fee. Comparing the
            // badge against it would credit the buyer for "saving" money on a surcharge that was
            // never really being charged as a discount target, so the badge instead compares the
            // carrier rate against `vendorShipmentFee` (heavy excluded) while the displayed price
            // and cap above stay pinned to `defaultShipmentFee` for backend parity.
            const isGreatDeal = Number.isFinite(methodAmount) && methodAmount < vendorShipmentFee
            const discountAmount = isGreatDeal ? vendorShipmentFee - methodAmount : 0
            const selectableRate: ShipmentRate =
              Number.isFinite(effectiveAmount) && effectiveAmount >= 0
                ? { ...rate, amount: effectiveAmount.toFixed(2) }
                : rate

            return (
              <label
                key={rate.objectId}
                className={`relative flex cursor-pointer items-center rounded-xl border p-4 transition-all hover:border-brand/50 ${
                  selectedRateId === rate.objectId
                    ? "border-brand bg-accent ring-1 ring-brand/25"
                    : "border-border-soft bg-surface-elevated"
                }`}
              >
                <input
                  type="radio"
                  name={`shipment-${sellerId}`}
                  className="sr-only"
                  checked={selectedRateId === rate.objectId}
                  onChange={() => onSelect(sellerId, selectableRate)}
                />
                <div className="flex min-w-0 flex-1 items-center">
                  <div className="mr-3 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-bold text-text-primary">
                        {rate.servicelevel?.name ?? "Shipping option"}
                      </span>
                      <div className="ml-2 text-right">
                        <div className="font-bold text-brand">{formatShippingAmount(effectiveAmount)}</div>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="truncate text-xs text-text-muted">{rate.durationTerms}</span>
                      <span className="text-xs font-medium text-success">Est. {rate.estimatedDays} days</span>
                    </div>
                    {isGreatDeal && discountAmount > 0 ? (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                        Great deal: {formatCurrency(discountAmount)} shipping discount
                      </div>
                    ) : null}
                  </div>
                </div>
                {selectedRateId === rate.objectId ? (
                  <div className="absolute top-2 right-2 rounded-full bg-brand p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : null}
              </label>
            )
          })(),
        )}
      </div>
    </div>
  )
}
