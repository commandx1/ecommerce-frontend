import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ChangeEvent, FormEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { type SearchProduct, searchPublicProducts } from "@/lib/api/product-search"
import { getFullImageUrl } from "@/lib/api/products"

interface UseMainSearchOptions {
  debounceMs?: number
  maxResults?: number
}

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_MAX_RESULTS = 20

/** Where the header search box submits to; only the trimmed query is forwarded. */
const buildSearchUrl = (query: string) => `/products?${new URLSearchParams({ q: query }).toString()}`

export const useMainSearch = ({
  debounceMs = DEFAULT_DEBOUNCE_MS,
  maxResults = DEFAULT_MAX_RESULTS,
}: UseMainSearchOptions = {}) => {
  const router = useRouter()
  const pathname = usePathname()
  const routeSearchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keeps the box showing the active term after a header search lands on /products (or after a
  // client-side navigation to a fresh /products?q=... URL, e.g. via browser back/forward).
  useEffect(() => {
    if (pathname === "/products") {
      setSearchQuery(routeSearchParams.get("q") ?? "")
    }
  }, [pathname, routeSearchParams])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchPublicProducts(searchQuery, 0, maxResults)
        if (isCancelled) return
        setSearchResults(results)
        setShowDropdown(results.length > 0)
      } catch {
        if (isCancelled) return
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }, debounceMs)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [debounceMs, maxResults, searchQuery])

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleInputFocus = useCallback(() => {
    if (searchResults.length > 0) {
      setShowDropdown(true)
    }
  }, [searchResults.length])

  const handleResultClick = useCallback(() => {
    setShowDropdown(false)
    setSearchQuery("")
  }, [])

  // Enter (native form submit) and the magnifier button (type="submit") both land here. An empty
  // (or whitespace-only) query does nothing beyond closing the dropdown — there is nothing useful
  // to search for on /products.
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setShowDropdown(false)
      const trimmed = searchQuery.trim()
      if (!trimmed) return
      router.push(buildSearchUrl(trimmed))
    },
    [searchQuery, router],
  )

  // The dropdown's trailing "See all results" row reuses the same destination/close behavior as a
  // native submit, without needing a synthetic form event.
  const handleSeeAllClick = useCallback(() => {
    setShowDropdown(false)
  }, [])

  const trimmedQuery = searchQuery.trim()
  const seeAllHref = trimmedQuery ? buildSearchUrl(trimmedQuery) : null

  const handleImageError = useCallback((productId: string) => {
    setImageFallbacks((prev) => ({
      ...prev,
      [productId]: true,
    }))
  }, [])

  const getImageSrc = useCallback(
    (product: SearchProduct) => {
      if (imageFallbacks[product.productId] || !product.coverPhotoPath) {
        return "/dentypro-product-placeholder.png"
      }
      return getFullImageUrl(product.coverPhotoPath)
    },
    [imageFallbacks],
  )

  return {
    dropdownRef,
    inputRef,
    searchQuery,
    searchResults,
    isLoading,
    showDropdown,
    handleInputChange,
    handleInputFocus,
    handleResultClick,
    handleSubmit,
    handleSeeAllClick,
    seeAllHref,
    trimmedQuery,
    handleImageError,
    getImageSrc,
  }
}
