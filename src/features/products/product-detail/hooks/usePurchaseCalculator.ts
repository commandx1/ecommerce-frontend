import { useEffect, useMemo, useState } from "react"
import { roundCurrency } from "@/lib/helpers/money"

interface BulkPricingOption {
  id: number
  range: string
  price: string
  note: string
  selected: boolean
}

interface OrderSummary {
  product: string
  productPrice: string
  shipping: string
  subtotal: string
  total: string
}

interface PurchaseCalculatorInput {
  bulkPricing: BulkPricingOption[]
  orderSummary: OrderSummary
  selectedSupplierPrice?: string
  selectedSupplierShippingFee?: string
  selectedSupplierHeavyShippingFee?: string
  stockCount: number
}

const parsePrice = (priceString: string): number => {
  if (!priceString) return 0
  return Number.parseFloat(priceString.replace(/[$,]/g, "")) || 0
}

const resolveBulkPricing = (bulkPricing: BulkPricingOption[], quantity: number) => {
  const sortedBulk = [...bulkPricing].sort((a, b) => {
    const getMin = (range: string) => parseInt((range.split("-")[0] ?? "").replace(/\+/g, ""), 10) || 0
    return getMin(b.range) - getMin(a.range)
  })

  for (const tier of sortedBulk) {
    const range = tier.range.toLowerCase()
    if (range.includes("+")) {
      const min = parseInt(range.replace(/\+/g, ""), 10)
      if (quantity >= min) return tier
    } else if (range.includes("-")) {
      const [min, max] = range.split("-").map((value) => parseInt(value, 10))
      if (min !== undefined && max !== undefined && quantity >= min && quantity <= max) return tier
    } else if (range.includes("1 unit")) {
      if (quantity === 1) return tier
    }
  }

  return bulkPricing.find((tier) => tier.selected) || bulkPricing[0]
}

export const usePurchaseCalculator = ({
  bulkPricing,
  orderSummary,
  selectedSupplierPrice,
  selectedSupplierShippingFee,
  selectedSupplierHeavyShippingFee,
  stockCount,
}: PurchaseCalculatorInput) => {
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (quantity > stockCount) {
      // Zero stock means zero purchasable units, not one - an out-of-stock supplier must clamp
      // down to 0, never back up to a selectable quantity.
      setQuantity(stockCount)
    } else if (quantity === 0 && stockCount > 0) {
      // Recovering from zero stock (e.g. switching to another supplier that has stock): the
      // downward-only clamp above never fires again on its own, so bump back up to 1 here.
      setQuantity(1)
    }
  }, [stockCount, quantity])

  const activeTier = useMemo(() => resolveBulkPricing(bulkPricing, quantity), [bulkPricing, quantity])
  const unitPrice = useMemo(() => {
    if (activeTier) return parsePrice(activeTier.price)
    if (selectedSupplierPrice) return parsePrice(selectedSupplierPrice)
    return parsePrice(orderSummary.productPrice)
  }, [activeTier, orderSummary.productPrice, selectedSupplierPrice])

  const shippingFeeUnitPrice = selectedSupplierShippingFee
    ? parsePrice(selectedSupplierShippingFee)
    : parsePrice(orderSummary.shipping)
  const heavyShippingFeeUnitPrice = selectedSupplierHeavyShippingFee ? parsePrice(selectedSupplierHeavyShippingFee) : 0
  // Shipping and the money totals below are rounded to the nearest cent: raw IEEE-754
  // multiplication (a per-unit fee * quantity) routinely leaves a binary-float tail that must
  // not leak past this hook. `productTotal` is kept as the raw per-line figure on purpose (it
  // feeds `unitPrice * quantity` displays that already format through Intl), but every actual
  // money total does not get to carry that tail.
  const shippingFeePrice = roundCurrency(shippingFeeUnitPrice * quantity)
  const heavyShippingFeePrice = roundCurrency(heavyShippingFeeUnitPrice * quantity)
  const shippingPrice = roundCurrency(shippingFeePrice + heavyShippingFeePrice)
  const productTotal = unitPrice * quantity
  const subtotal = roundCurrency(productTotal)
  // No tax is estimated here: sales tax is address-based and computed by the backend at order
  // creation, and this screen has no address yet.
  const total = roundCurrency(subtotal + shippingPrice)

  return {
    quantity,
    setQuantity,
    activeTier,
    unitPrice,
    shippingFeePrice,
    heavyShippingFeePrice,
    shippingPrice,
    productTotal,
    subtotal,
    total,
  }
}
