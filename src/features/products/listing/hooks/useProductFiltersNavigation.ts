"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { createContext, useCallback, useContext, useTransition } from "react"

export interface FilterUpdates {
  brands?: string[]
  manufacturers?: string[]
  categories?: string[]
  vendors?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  minRating?: number | null
  inStock?: boolean
  attributes?: string[]
}

export interface FilterNavigationState {
  isPending: boolean
  navigate: (updates: FilterUpdates) => void
  currentBrands: string[]
  currentManufacturers: string[]
  currentCategories: string[]
  currentVendors: string[]
  currentMinPrice: number | null
  currentMaxPrice: number | null
  currentMinRating: number | null
  currentInStock: boolean
  currentAttributes: string[]
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
      const sort = searchParams.get("sort")
      params.set("page", "1")
      if (size) params.set("size", size)
      if (view) params.set("view", view)
      if (sort) params.set("sort", sort)

      const brands = "brands" in updates ? updates.brands : searchParams.getAll("brands")
      const manufacturers =
        "manufacturers" in updates ? updates.manufacturers : searchParams.getAll("manufacturers")
      const categories = "categories" in updates ? updates.categories : searchParams.getAll("categories")
      const vendors = "vendors" in updates ? updates.vendors : searchParams.getAll("vendors")
      const attributes = "attributes" in updates ? updates.attributes : searchParams.getAll("attributes")
      const rawMin = searchParams.get("minPrice")
      const rawMax = searchParams.get("maxPrice")
      const rawRating = searchParams.get("minRating")
      const minPrice = "minPrice" in updates ? updates.minPrice : rawMin ? Number(rawMin) : null
      const maxPrice = "maxPrice" in updates ? updates.maxPrice : rawMax ? Number(rawMax) : null
      const minRating = "minRating" in updates ? updates.minRating : rawRating ? Number(rawRating) : null
      const inStock = "inStock" in updates ? updates.inStock : searchParams.get("inStock") !== "false"

      for (const b of brands ?? []) params.append("brands", b)
      for (const m of manufacturers ?? []) params.append("manufacturers", m)
      for (const c of categories ?? []) params.append("categories", c)
      for (const v of vendors ?? []) params.append("vendors", v)
      for (const a of attributes ?? []) params.append("attributes", a)
      if (minPrice != null && !Number.isNaN(minPrice)) params.set("minPrice", String(minPrice))
      if (maxPrice != null && !Number.isNaN(maxPrice)) params.set("maxPrice", String(maxPrice))
      if (minRating != null && !Number.isNaN(minRating)) params.set("minRating", String(minRating))
      if (inStock === false) params.set("inStock", "false")

      startTransition(() => {
        router.push(`/products?${params.toString()}`, { scroll: false })
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
    currentCategories: searchParams.getAll("categories"),
    currentVendors: searchParams.getAll("vendors"),
    currentMinPrice: rawMinPrice ? Number(rawMinPrice) : null,
    currentMaxPrice: rawMaxPrice ? Number(rawMaxPrice) : null,
    currentMinRating: rawMinRating ? Number(rawMinRating) : null,
    currentInStock: searchParams.get("inStock") !== "false",
    currentAttributes: searchParams.getAll("attributes"),
  }
}

export function useProductFiltersNavigation(): FilterNavigationState {
  const ctx = useContext(FilterNavigationContext)
  if (!ctx) throw new Error("useProductFiltersNavigation must be used within FilterNavigationProvider")
  return ctx
}
