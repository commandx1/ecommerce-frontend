"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { productsAPI } from "@/lib/api/products"
import { useDebounce } from "@/lib/hooks/useDebounce"

const PAGE_SIZE = 20
const SCROLL_THRESHOLD_PX = 48
const BRAND_SEARCH_DEBOUNCE_MS = 400

export interface UseBrandFilterDropdownInput {
  onChange: (brand: string | null) => void
  accessToken: string | null
}

/**
 * Search-on-open, debounced, infinite-scroll brand picker (GET /api/products/brands/search).
 * Imperative like the editor's own product search (design §3.2): every open/query/page change
 * aborts the previous request, and pages are appended - nothing else shares this fetch.
 */
export function useBrandFilterDropdown({ onChange, accessToken }: UseBrandFilterDropdownInput) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [brands, setBrands] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Remembers the params of the most recent fetch attempt (including failed ones) so the
  // "Try again" button can retry the exact request that failed, whether it was the initial
  // page or an infinite-scroll "load more".
  const lastFetchRef = useRef<{ term: string; page: number; append: boolean } | null>(null)
  const debouncedQuery = useDebounce(query, BRAND_SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus the search field when the dropdown opens (replaces the `autoFocus` attribute,
  // which fires on mount regardless of user intent).
  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus()
  }, [isOpen])

  const fetchBrands = useCallback(
    async (searchTerm: string, targetPage: number, options: { append?: boolean } = {}) => {
      if (!accessToken) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      lastFetchRef.current = { term: searchTerm, page: targetPage, append: !!options.append }

      if (options.append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const response = await productsAPI.searchBrands(
          { search: searchTerm, page: targetPage, size: PAGE_SIZE },
          accessToken,
          controller.signal,
        )

        // A malformed 200 (missing/null/non-array `content`) must not reach setState as-is -
        // rendering later does an unconditional `.length`/`.map` over `brands`, which would throw
        // and blank the whole page for every vendor, not just show "no brands". Same defensive
        // normalization for `number`/`last`, which unconditionally drive the next page fetch.
        const content = Array.isArray(response.content) ? response.content : []
        setBrands((prev) => (options.append ? [...prev, ...content] : content))
        setPage(typeof response.number === "number" ? response.number : targetPage)
        setHasMore(response.last === false)
        setError(null)
      } catch {
        if (controller.signal.aborted) return
        if (!options.append) setBrands([])
        setHasMore(false)
        // A failed request must never look like "no brands exist" - the brand field below is
        // required, so a vendor who can't tell an outage from an empty catalog gets stuck
        // unable to create a product at all, with no idea why. Surface it and let them retry.
        setError("We couldn't load brands. Please try again.")
      } finally {
        // Never `return` from `finally` — it would silently swallow returns/throws from try/catch.
        if (!controller.signal.aborted) {
          if (options.append) setIsLoadingMore(false)
          else setIsLoading(false)
        }
      }
    },
    [accessToken],
  )

  useEffect(() => {
    if (!isOpen) return
    fetchBrands(debouncedQuery.trim(), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, debouncedQuery, fetchBrands])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleListScroll = () => {
    const el = listRef.current
    if (!el || isLoading || isLoadingMore || !hasMore) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom <= SCROLL_THRESHOLD_PX) {
      fetchBrands(debouncedQuery.trim(), page + 1, { append: true })
    }
  }

  const handleSelect = (brand: string | null) => {
    onChange(brand)
    setIsOpen(false)
  }

  const handleRetry = () => {
    const last = lastFetchRef.current
    if (last) {
      fetchBrands(last.term, last.page, { append: last.append })
    } else {
      fetchBrands(debouncedQuery.trim(), 0)
    }
  }

  return {
    isOpen,
    query,
    brands,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    containerRef,
    listRef,
    searchInputRef,
    toggleOpen: () => setIsOpen((prev) => !prev),
    setQuery,
    handleListScroll,
    handleSelect,
    handleRetry,
  }
}

export type BrandFilterDropdownViewModel = ReturnType<typeof useBrandFilterDropdown>
