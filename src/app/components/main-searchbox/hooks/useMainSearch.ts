import type { ChangeEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { searchPublicProducts, type SearchProduct } from "@/lib/api/product-search"
import { getFullImageUrl } from "@/lib/api/products"

interface UseMainSearchOptions {
  debounceMs?: number
  maxResults?: number
}

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_MAX_RESULTS = 20

export const useMainSearch = (
  { debounceMs = DEFAULT_DEBOUNCE_MS, maxResults = DEFAULT_MAX_RESULTS }: UseMainSearchOptions = {},
) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
  }, [])

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
    handleImageError,
    getImageSrc,
  }
}
