import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo } from "react"

import type { SupplierViewModel } from "../types"

const parsePrice = (priceString: string): number => {
  return Number.parseFloat(priceString.replace(/[$,]/g, "")) || 0
}

export const useSupplierSelection = (suppliers: SupplierViewModel[], bestPriceVendorUserProductId?: string | null) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const vendorIdFromUrl = searchParams.get("vendorId")

  const fallbackSupplier = useMemo(() => {
    return suppliers.find((supplier) => supplier.userProductId === bestPriceVendorUserProductId) || suppliers[0] || null
  }, [bestPriceVendorUserProductId, suppliers])

  const selectedSupplier = useMemo(() => {
    if (vendorIdFromUrl) {
      const supplierFromUrl = suppliers.find((supplier) => supplier.userProductId === vendorIdFromUrl)
      if (supplierFromUrl) {
        return supplierFromUrl
      }
    }
    return fallbackSupplier
  }, [fallbackSupplier, suppliers, vendorIdFromUrl])

  const selectedVendorId = selectedSupplier?.userProductId

  const setSelectedSupplier = useCallback(
    (supplier: SupplierViewModel | null) => {
      const nextVendorId = supplier?.userProductId
      if (!nextVendorId || nextVendorId === vendorIdFromUrl) return

      const params = new URLSearchParams(searchParams.toString())
      params.set("vendorId", nextVendorId)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, vendorIdFromUrl],
  )

  useEffect(() => {
    if (!selectedVendorId || selectedVendorId === vendorIdFromUrl) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("vendorId", selectedVendorId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams, selectedVendorId, vendorIdFromUrl])

  const selectedPrice = selectedSupplier ? parsePrice(selectedSupplier.price) : 0

  return {
    selectedSupplier,
    setSelectedSupplier,
    selectedPrice,
  }
}
