import { Check, Info, Truck } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { type ShipmentRate, shipmentAPI, type UberQuote } from "@/lib/api/shipment"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface SellerShipmentRatesProps {
  sellerId: string
  sellerName: string
  items: { userProductId: string; name: string; quantity: number }[]
  addressId: string
  userId: string
  cartId: string
  onSelect: (sellerId: string, rate: ShipmentRate | UberQuote) => void
  selectedRateId?: string
}

export default function VendorShipmentRates({
  sellerId,
  sellerName,
  items,
  addressId,
  userId,
  cartId,
  onSelect,
  selectedRateId,
}: SellerShipmentRatesProps) {
  const [rates, setRates] = useState<ShipmentRate[]>([])
  const [uberQuote, setUberQuote] = useState<UberQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const itemsKey = JSON.stringify(items)

  useEffect(() => {
    let isMounted = true

    const fetchRates = async () => {
      if (!isMounted) return
      setIsLoading(true)
      setError(null)
      try {
        const response = await shipmentAPI.getRates({
          addressId,
          userId: sellerId ?? "",
          cartId,
          parcels: items.flatMap((item) =>
            Array.from({ length: item.quantity }, () => ({ userProductId: item.userProductId })),
          ),
        })

        if (!isMounted) return

        setRates(
          response.shippoRates.filter(
            (rate) => !rate.servicelevel.name.includes("Air") && !rate.servicelevel.name.includes("Ground"),
          ),
        )
        setUberQuote(response.uberQuote)

        // Auto-select first rate if none selected
        if (!selectedRateId && response.shippoRates.length > 0) {
          onSelect(sellerId, response.shippoRates[0])
        }
      } catch (err) {
        if (!isMounted) return
        setError("Failed to fetch shipping rates")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (addressId && items.length > 0) {
      fetchRates()
    }

    return () => {
      isMounted = false
    }
  }, [addressId, itemsKey, userId, cartId, onSelect])

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-100 rounded-xl bg-red-50 text-red-600 text-sm flex items-center">
        <Info className="w-4 h-4 mr-2" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-700 flex items-center text-sm">
            <Truck className="w-4 h-4 mr-2 text-steel-blue/70" />
            Shipping from: <span className="text-steel-blue/80 ml-1">{sellerName}</span>
          </h4>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {items.length} items
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rates.map((rate) => (
          <label
            key={rate.objectId}
            className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-steel-blue/50 ${
              selectedRateId === rate.objectId
                ? "border-steel-blue bg-blue-50/50 ring-1 ring-steel-blue"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name={`shipment-${sellerId}`}
              className="sr-only"
              checked={selectedRateId === rate.objectId}
              onChange={() => onSelect(sellerId, rate)}
            />
            <div className="flex items-center flex-1">
              <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 p-1 mr-4 shrink-0 flex items-center justify-center">
                <Image
                  src={rate.providerImage75}
                  alt={rate.provider}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 truncate">{rate.servicelevel.name}</span>
                  <span className="font-bold text-steel-blue ml-2">{formatCurrency(Number(rate.amount))}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 truncate">{rate.durationTerms}</span>
                  <span className="text-xs font-medium text-green-600">Est. {rate.estimatedDays} days</span>
                </div>
              </div>
            </div>
            {selectedRateId === rate.objectId && (
              <div className="absolute top-2 right-2">
                <div className="bg-steel-blue rounded-full p-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </label>
        ))}

        {uberQuote && (
          <label
            className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-steel-blue/50 ${
              selectedRateId === uberQuote.id
                ? "border-steel-blue bg-blue-50/50 ring-1 ring-steel-blue"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name={`shipment-${sellerId}`}
              className="sr-only"
              checked={selectedRateId === uberQuote.id}
              onChange={() => onSelect(sellerId, uberQuote)}
            />
            <div className="flex items-center flex-1">
              <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 p-1 mr-4 shrink-0 flex items-center justify-center font-bold text-xs text-black">
                UBER
              </div>
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Uber Direct</span>
                  <span className="font-bold text-steel-blue ml-2">{formatCurrency(uberQuote.fee / 100)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Same-day delivery</span>
                  <span className="text-xs font-medium text-green-600">{uberQuote.duration} mins</span>
                </div>
              </div>
            </div>
            {selectedRateId === uberQuote.id && (
              <div className="absolute top-2 right-2">
                <div className="bg-steel-blue rounded-full p-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </label>
        )}
      </div>
    </div>
  )
}
