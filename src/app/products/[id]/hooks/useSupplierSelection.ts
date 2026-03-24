import { useEffect, useMemo, useState } from "react"

import { useSelectedSupplierStore } from "@/stores/selectedSupplierStore"

import type { SupplierViewModel } from "../types"

const parsePrice = (priceString: string): number => {
  return Number.parseFloat(priceString.replace(/[$,]/g, "")) || 0
}

export const useSupplierSelection = (
  suppliers: SupplierViewModel[],
  bestPriceVendorUserProductId?: string | null,
) => {
  const defaultSupplier = useMemo(() => {
    return suppliers.find((supplier) => supplier.userProductId === bestPriceVendorUserProductId) || suppliers[0] || null
  }, [bestPriceVendorUserProductId, suppliers])

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierViewModel | null>(defaultSupplier)
  const setGlobalSelectedSupplier = useSelectedSupplierStore((state) => state.setSelectedSupplier)

  useEffect(() => {
    setGlobalSelectedSupplier(selectedSupplier)
  }, [selectedSupplier, setGlobalSelectedSupplier])

  useEffect(() => {
    setSelectedSupplier(defaultSupplier)
    setGlobalSelectedSupplier(defaultSupplier)
  }, [defaultSupplier, setGlobalSelectedSupplier])

  const selectedPrice = selectedSupplier ? parsePrice(selectedSupplier.price) : 0

  return {
    selectedSupplier,
    setSelectedSupplier,
    selectedPrice,
  }
}
