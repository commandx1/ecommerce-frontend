"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { createContext, useCallback, useContext, useTransition } from "react"

export interface FilterUpdates {
  brands?: string[]
  manufacturers?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  minRating?: number | null
  inStock?: boolean
}

export interface FilterNavigationState {
  isPending: boolean
  navigate: (updates: FilterUpdates) => void
  currentBrands: string[]
  currentManufacturers: string[]
  currentMinPrice: number | null
  currentMaxPrice: number | null
  currentMinRating: number | null
  currentInStock: boolean
}

export const FilterNavigationContext = createContext<FilterNavigationState | null>(null)

export function useFilterNavigationProvider(): FilterNavigationState {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = useCallback(
    (updates: FilterUpdates) => {
      const params = new URLSearchParams()

      const size = searchParams.get("size")
      const view = searchParams.get("view")
      params.set("page", "1")
      if (size) params.set("size", size)
      if (view) params.set("view", view)

      const brands = "brands" in updates ? updates.brands : searchParams.getAll("brands")
      const manufacturers =
        "manufacturers" in updates ? updates.manufacturers : searchParams.getAll("manufacturers")
      const rawMin = searchParams.get("minPrice")
      const rawMax = searchParams.get("maxPrice")
      const rawRating = searchParams.get("minRating")
      const minPrice = "minPrice" in updates ? updates.minPrice : rawMin ? Number(rawMin) : null
      const maxPrice = "maxPrice" in updates ? updates.maxPrice : rawMax ? Number(rawMax) : null
      const minRating = "minRating" in updates ? updates.minRating : rawRating ? Number(rawRating) : null
      const inStock = "inStock" in updates ? updates.inStock : searchParams.get("inStock") !== "false"

      for (const b of brands ?? []) params.append("brands", b)
      for (const m of manufacturers ?? []) params.append("manufacturers", m)
      if (minPrice != null && !Number.isNaN(minPrice)) params.set("minPrice", String(minPrice))
      if (maxPrice != null && !Number.isNaN(maxPrice)) params.set("maxPrice", String(maxPrice))
      if (minRating != null && !Number.isNaN(minRating)) params.set("minRating", String(minRating))
      if (inStock === false) params.set("inStock", "false")

      startTransition(() => {
        router.push(`/products?${params.toString()}`)
      })
    },
    [router, searchParams],
  )

  const rawMinPrice = searchParams.get("minPrice")
  const rawMaxPrice = searchParams.get("maxPrice")
  const rawMinRating = searchParams.get("minRating")

  return {
    isPending,
    navigate,
    currentBrands: searchParams.getAll("brands"),
    currentManufacturers: searchParams.getAll("manufacturers"),
    currentMinPrice: rawMinPrice ? Number(rawMinPrice) : null,
    currentMaxPrice: rawMaxPrice ? Number(rawMaxPrice) : null,
    currentMinRating: rawMinRating ? Number(rawMinRating) : null,
    currentInStock: searchParams.get("inStock") !== "false",
  }
}

export function useProductFiltersNavigation(): FilterNavigationState {
  const ctx = useContext(FilterNavigationContext)
  if (!ctx) throw new Error("useProductFiltersNavigation must be used within FilterNavigationProvider")
  return ctx
}
