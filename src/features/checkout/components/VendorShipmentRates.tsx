import { Check, Info, Truck } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
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

interface RatesResponseData {
  shippoRates: ShipmentRate[]
  uberQuote: UberQuote | null
  defaultShipmentFee: number | null
}

function formatShippingAmount(amount: number): string {
  return amount === 0 ? "Free" : formatCurrency(amount)
}

// `rate.amount` is a raw string from Shippo and can be non-numeric or negative. A negative amount
// would win auto-selection and fabricate a "Great deal" badge, so treat it as unusable too.
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

// `rate.servicelevel` and every string inside it can be null for a real Shippo rate (see
// `ShipmentRate` in `lib/api/shipment.ts`). A rate that cannot be classified is kept, not dropped.
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
    <div className="rounded-xl border border-border-soft bg-surface-muted p-4" aria-busy="true">
      <span className="sr-only">Loading shipping rates…</span>
      <Skeleton className="mb-4 h-4 w-1/4" />
      <div className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
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
  // The previous response actually applied by THIS component instance, kept only to detect a
  // stale/changed selection across a refetch (see `applyRatesData` below). `null` means "no
  // response has landed yet" — the very first response of a mount must never override a
  // selection it did not itself make (e.g. one resumed from a parent/session), only a later
  // refetch may replace it.
  const previousResponseRef = useRef<RatesResponseData | null>(null)

  useEffect(() => {
    let isMounted = true

    const applyRatesData = (data: RatesResponseData) => {
      const filteredRates = data.shippoRates.filter((rate) => !isExcludedServiceLevel(rate))

      setRates(filteredRates)
      setUberQuote(data.uberQuote)
      setDefaultShipmentFee(data.defaultShipmentFee)

      const previousResponse = previousResponseRef.current
      previousResponseRef.current = {
        shippoRates: filteredRates,
        uberQuote: data.uberQuote,
        defaultShipmentFee: data.defaultShipmentFee,
      }

      const cheapestRate = [...filteredRates].sort(
        (a, b) =>
          getEffectiveRateAmount(a, data.defaultShipmentFee) - getEffectiveRateAmount(b, data.defaultShipmentFee),
      )[0]
      const cheapestRateAmount = cheapestRate
        ? getEffectiveRateAmount(cheapestRate, data.defaultShipmentFee)
        : Number.POSITIVE_INFINITY
      const uberAmount = data.uberQuote ? getUberQuoteAmount(data.uberQuote) : Number.POSITIVE_INFINITY

      const selectCheapest = () => {
        if (filteredRates.length === 0 && !data.uberQuote) return

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

      const currentSelectedId = selectedRateIdRef.current

      if (!currentSelectedId) {
        selectCheapest()
        return
      }

      if (!previousResponse) {
        // First response of this mount and a rate is already selected (carried over from a
        // parent/session, not chosen from data this component has seen) — trust it as-is.
        return
      }

      // A refetch (cart/address/etc. changed) landed while a rate was already selected. That
      // selection was validated against the PREVIOUS response — if its id is gone from the
      // fresh one it is stale and must not silently ride along into the order; if it survived
      // but its price moved, the parent must hear about the new amount.
      const matchedUber = data.uberQuote && data.uberQuote.id === currentSelectedId ? data.uberQuote : null
      if (matchedUber) {
        const previousUberAmount = previousResponse.uberQuote ? getUberQuoteAmount(previousResponse.uberQuote) : null
        const newUberAmount = getUberQuoteAmount(matchedUber)
        if (previousUberAmount === null || previousUberAmount !== newUberAmount) {
          onSelectRef.current(sellerId, matchedUber)
        }
        return
      }

      const matchedRate = filteredRates.find(
        (rate) =>
          rate.objectId === currentSelectedId && Number.isFinite(getEffectiveRateAmount(rate, data.defaultShipmentFee)),
      )
      if (matchedRate) {
        const newAmount = getEffectiveRateAmount(matchedRate, data.defaultShipmentFee)
        const previousMatch = previousResponse.shippoRates.find((rate) => rate.objectId === currentSelectedId)
        const previousAmount = previousMatch
          ? getEffectiveRateAmount(previousMatch, previousResponse.defaultShipmentFee)
          : null
        if (previousAmount === null || previousAmount !== newAmount) {
          onSelectRef.current(sellerId, { ...matchedRate, amount: newAmount.toFixed(2) })
        }
        return
      }

      // Selected id is no longer present (or no longer usable) in the fresh response.
      selectCheapest()
    }

    const fetchRates = async () => {
      const parcels = items.map((item) => ({
        userProductId: item.userProductId,
        quantity: item.quantity,
      }))

      setIsLoading(true)
      setHasError(false)

      try {
        const response = await shipmentAPI.getRates({
          addressId,
          userId: sellerId,
          cartId,
          parcels,
        })

        if (!isMounted) return

        const responseDefaultShipmentFee =
          typeof response.defaultShipmentFee === "number" && Number.isFinite(response.defaultShipmentFee)
            ? response.defaultShipmentFee
            : null

        applyRatesData({
          shippoRates: response.shippoRates,
          uberQuote: response.uberQuote,
          defaultShipmentFee: responseDefaultShipmentFee,
        })
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

  // The seller's plain product shipment fee (heavy surcharge excluded), used only as the "Great
  // deal" badge's comparison base - see the badge computation below.
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
    // A rate with an unusable amount is DROPPED, not sorted last: it would render as "$0.00" and,
    // once selected, feed the raw negative amount into the order total.
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
                        <span className="text-xs font-medium text-success">Est. 1-4 hours</span>
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
            // `defaultShipmentFee` (Σ shipmentFee·qty, heavy surcharge excluded - heavy is charged
            // separately) caps what the buyer pays for carrier shipping; it is not a discountable fee.
            // The badge compares against `vendorShipmentFee`; the price and cap stay pinned to
            // `defaultShipmentFee` for backend parity.
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
