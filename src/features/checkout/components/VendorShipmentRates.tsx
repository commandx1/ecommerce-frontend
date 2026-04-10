import { Check, Info, Truck } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { type ShipmentRate, shipmentAPI, type UberQuote } from "@/lib/api/shipment"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface VendorShipmentRatesProps {
  sellerId: string
  sellerName: string
  items: { userProductId: string; name: string; quantity: number }[]
  addressId: string
  cartId: string
  onSelect: (sellerId: string, rate: ShipmentRate | UberQuote) => void
  selectedRateId?: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const selectedRateIdRef = useRef(selectedRateId)
  selectedRateIdRef.current = selectedRateId

  useEffect(() => {
    let isMounted = true

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

        const filteredRates = response.shippoRates.filter(
          (rate) => !rate.servicelevel.name.includes("Air") && !rate.servicelevel.name.includes("Ground"),
        )

        setRates(filteredRates)
        setUberQuote(response.uberQuote)

        if (!selectedRateIdRef.current && filteredRates.length > 0) {
          onSelectRef.current(sellerId, filteredRates[0])
        }
      } catch (_error) {
        if (!isMounted) return
        setHasError(true)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (addressId && items.length > 0) {
      void fetchRates()
    }

    return () => {
      isMounted = false
    }
  }, [addressId, cartId, items, sellerId])

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

      <div className="grid grid-cols-1 gap-3">
        {rates.map((rate) => (
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
              onChange={() => onSelect(sellerId, rate)}
            />
            <div className="flex flex-1 items-center">
              <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-surface p-1">
                <Image
                  src={rate.providerImage75}
                  alt={rate.provider}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="mr-3 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate font-bold text-text-primary">{rate.servicelevel.name}</span>
                  <span className="ml-2 font-bold text-brand">{formatCurrency(Number(rate.amount))}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="truncate text-xs text-text-muted">{rate.durationTerms}</span>
                  <span className="text-xs font-medium text-success">Est. {rate.estimatedDays} days</span>
                </div>
              </div>
            </div>
            {selectedRateId === rate.objectId ? (
              <div className="absolute top-2 right-2 rounded-full bg-brand p-0.5">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : null}
          </label>
        ))}

        {uberQuote ? (
          <label
            className={`relative flex cursor-pointer items-center rounded-xl border p-4 transition-all hover:border-brand/50 ${
              selectedRateId === uberQuote.id
                ? "border-brand bg-accent ring-1 ring-brand/25"
                : "border-border-soft bg-surface-elevated"
            }`}
          >
            <input
              type="radio"
              name={`shipment-${sellerId}`}
              className="sr-only"
              checked={selectedRateId === uberQuote.id}
              onChange={() => onSelect(sellerId, uberQuote)}
            />
            <div className="flex flex-1 items-center">
              <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-surface p-1 text-xs font-bold text-text-primary">
                UBER
              </div>
              <div className="mr-3 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">Uber Direct</span>
                  <span className="ml-2 font-bold text-brand">{formatCurrency(uberQuote.fee / 100)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Same-day delivery</span>
                  <span className="text-xs font-medium text-success">{uberQuote.duration} mins</span>
                </div>
              </div>
            </div>
            {selectedRateId === uberQuote.id ? (
              <div className="absolute top-2 right-2 rounded-full bg-brand p-0.5">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : null}
          </label>
        ) : null}
      </div>
    </div>
  )
}
