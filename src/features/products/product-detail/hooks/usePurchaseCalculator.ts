import { useEffect, useMemo, useState } from "react"

interface BulkPricingOption {
  id: number
  range: string
  price: string
  note: string
  selected: boolean
}

interface WarrantyOption {
  id: number
  value: string
  title: string
  description: string
  price: string
  selected: boolean
}

interface OrderSummary {
  product: string
  productPrice: string
  warranty: string
  shipping: string
  subtotal: string
  tax: string
  total: string
}

interface PurchaseCalculatorInput {
  bulkPricing: BulkPricingOption[]
  warrantyOptions: WarrantyOption[]
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
    const getMin = (range: string) => parseInt(range.split("-")[0].replace(/\+/g, "")) || 0
    return getMin(b.range) - getMin(a.range)
  })

  for (const tier of sortedBulk) {
    const range = tier.range.toLowerCase()
    if (range.includes("+")) {
      const min = parseInt(range.replace(/\+/g, ""))
      if (quantity >= min) return tier
    } else if (range.includes("-")) {
      const [min, max] = range.split("-").map((value) => parseInt(value))
      if (quantity >= min && quantity <= max) return tier
    } else if (range.includes("1 unit")) {
      if (quantity === 1) return tier
    }
  }

  return bulkPricing.find((tier) => tier.selected) || bulkPricing[0]
}

export const usePurchaseCalculator = ({
  bulkPricing,
  warrantyOptions,
  orderSummary,
  selectedSupplierPrice,
  selectedSupplierShippingFee,
  selectedSupplierHeavyShippingFee,
  stockCount,
}: PurchaseCalculatorInput) => {
  const defaultWarranty = useMemo(() => {
    return warrantyOptions.find((w) => w.selected)?.value || warrantyOptions[0]?.value || "standard"
  }, [warrantyOptions])

  const [quantity, setQuantity] = useState(1)
  const [selectedWarranty, setSelectedWarranty] = useState(defaultWarranty)

  useEffect(() => {
    if (quantity > stockCount) {
      setQuantity(stockCount || 1)
    }
  }, [stockCount, quantity])

  useEffect(() => {
    setSelectedWarranty(defaultWarranty)
  }, [defaultWarranty])

  const activeTier = useMemo(() => resolveBulkPricing(bulkPricing, quantity), [bulkPricing, quantity])
  const unitPrice = useMemo(() => {
    if (activeTier) return parsePrice(activeTier.price)
    if (selectedSupplierPrice) return parsePrice(selectedSupplierPrice)
    return parsePrice(orderSummary.productPrice)
  }, [activeTier, orderSummary.productPrice, selectedSupplierPrice])

  const warrantyPrice = useMemo(() => {
    const selected = warrantyOptions.find((w) => w.value === selectedWarranty)
    return parsePrice(selected?.price || orderSummary.warranty)
  }, [orderSummary.warranty, selectedWarranty, warrantyOptions])

  const shippingFeeUnitPrice = selectedSupplierShippingFee
    ? parsePrice(selectedSupplierShippingFee)
    : parsePrice(orderSummary.shipping)
  const heavyShippingFeeUnitPrice = selectedSupplierHeavyShippingFee ? parsePrice(selectedSupplierHeavyShippingFee) : 0
  const shippingFeePrice = shippingFeeUnitPrice * quantity
  const heavyShippingFeePrice = heavyShippingFeeUnitPrice * quantity
  const shippingPrice = shippingFeePrice + heavyShippingFeePrice
  const productTotal = unitPrice * quantity
  const subtotal = productTotal + warrantyPrice
  const tax = subtotal * 0.1
  const total = subtotal + shippingPrice + tax

  return {
    quantity,
    setQuantity,
    selectedWarranty,
    setSelectedWarranty,
    activeTier,
    unitPrice,
    warrantyPrice,
    shippingFeePrice,
    heavyShippingFeePrice,
    shippingPrice,
    productTotal,
    subtotal,
    tax,
    total,
  }
}
