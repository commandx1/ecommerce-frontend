"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { type NormalizedSearchProduct, productsAPI } from "@/lib/api/products"
import { useDebounce } from "@/lib/hooks/useDebounce"

const SEARCH_PAGE_SIZE = 10
const SEARCH_SCROLL_THRESHOLD_PX = 48
const SEARCH_DEBOUNCE_MS = 500

/**
 * Catalogue search (GET /api/products/active): debounced query + brand filter, infinite scroll,
 * click-outside close, and the result click that loads the full product for ProductDetailsModal.
 * Imperative on purpose (design §3.2): every new query aborts the previous request and pages are
 * appended, which nothing else shares.
 */
export function useProductSearch(accessToken: string | null) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [results, setResults] = useState<NormalizedSearchProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [resultsPage, setResultsPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  const [modalProduct, setModalProduct] = useState<NormalizedSearchProduct | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsListRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Mirrors `searchQuery` synchronously on every render (unlike `debouncedQuery`, which lags
  // behind by SEARCH_DEBOUNCE_MS). Lets the brand-change effect below tell "the visible query was
  // just cleared" from "the debounced value hasn't caught up to a still-non-empty query yet".
  const searchQueryRef = useRef(searchQuery)
  searchQueryRef.current = searchQuery

  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS)

  // Close the dropdown on a click outside both the input and the dropdown.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const performSearch = useCallback(
    async (query: string, brand: string | null, page: number, options: { append?: boolean } = {}) => {
      if (!query.trim() || !accessToken) {
        abortControllerRef.current?.abort()
        setResults([])
        setShowDropdown(false)
        setHasMore(false)
        return
      }

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      if (options.append) setIsLoadingMore(true)
      else setIsSearching(true)

      try {
        const response = await productsAPI.searchActiveProducts(
          { search: query.trim(), brand, page, size: SEARCH_PAGE_SIZE },
          accessToken,
          controller.signal,
        )
        // A malformed 200 (missing/null/non-array `content`) must not reach a bare `.map` - that
        // would throw inside this try block and surface as a raw JS error via the catch below
        // ("Search error: Cannot read properties of undefined ...") instead of a real result or a
        // clean status. Same defensive normalization for `number`/`last`, which drive pagination.
        const rawContent = Array.isArray(response.content) ? response.content : []
        const normalized = rawContent.map((item) => productsAPI.normalizeActiveProductSearchItem(item))

        setResults((prev) => (options.append ? [...prev, ...normalized] : normalized))
        setResultsPage(typeof response.number === "number" ? response.number : page)
        setHasMore(response.last === false)
        setShowDropdown(true)
      } catch (error) {
        if (controller.signal.aborted) return

        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error.message as string)
            : error instanceof Error
              ? error.message
              : "An error occurred during search"
        showToast.error(`Search error: ${errorMessage}`)
        if (!options.append) setResults([])
        setHasMore(false)
      } finally {
        // Never `return` from `finally` — it would silently swallow returns/throws from try/catch.
        if (!controller.signal.aborted) {
          if (options.append) setIsLoadingMore(false)
          else setIsSearching(false)
        }
      }
    },
    [accessToken],
  )

  // A fresh (page 0) search whenever the settled query or the brand filter changes. A brand
  // change is not debounced, so it can fire this effect before `debouncedQuery` has caught up to
  // a query that was just cleared (e.g. by `reset`, which changes both together) - `searchQueryRef`
  // is checked instead of `debouncedQuery` here because it is never stale.
  useEffect(() => {
    if (!searchQueryRef.current.trim()) return
    performSearch(debouncedQuery, selectedBrand, 0)
  }, [debouncedQuery, selectedBrand, performSearch])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  return {
    searchQuery,
    debouncedQuery,
    selectedBrand,
    results,
    isSearching,
    isLoadingMore,
    hasMore,
    showDropdown,
    brokenImageIds,
    loadingDetailId,
    modalProduct,
    searchInputRef,
    dropdownRef,
    resultsListRef,
    setSearchQuery,
    setSelectedBrand,
    reopenDropdown: () => {
      if (results.length > 0) setShowDropdown(true)
    },
    /** The input's X button. Unlike `reset`, it keeps the brand filter and does not abort. */
    clearQuery: () => {
      setSearchQuery("")
      setResults([])
      setShowDropdown(false)
      setHasMore(false)
    },
    markImageBroken: (key: string) => setBrokenImageIds((prev) => new Set(prev).add(key)),

    handleResultsScroll: () => {
      const el = resultsListRef.current
      if (!el || isSearching || isLoadingMore || !hasMore) return

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      if (distanceFromBottom <= SEARCH_SCROLL_THRESHOLD_PX) {
        performSearch(debouncedQuery, selectedBrand, resultsPage + 1, { append: true })
      }
    },

    // /api/products/active only returns a partial projection, so the modal needs the full product.
    selectResult: async (item: NormalizedSearchProduct) => {
      if (!accessToken || loadingDetailId) return

      setLoadingDetailId(item.id)
      try {
        const fullProduct = await productsAPI.getProductById(item.id, accessToken)
        setModalProduct(productsAPI.normalizeBarcodeResult(fullProduct))
      } catch (error) {
        showToast.error((error as { message?: string })?.message || "Failed to load product details")
      } finally {
        setLoadingDetailId(null)
      }
    },
    closeModal: () => setModalProduct(null),

    /** Aborts any in-flight search and empties query, brand filter, results and paging. */
    reset: () => {
      // Abort here skips performSearch's own `finally` (it only clears these when its own signal
      // was not aborted), so clear them here too - otherwise a reset mid-search left the panel
      // stuck showing its loading state with nothing left to load.
      abortControllerRef.current?.abort()
      setIsSearching(false)
      setIsLoadingMore(false)
      setSearchQuery("")
      setSelectedBrand(null)
      setResults([])
      setResultsPage(0)
      setHasMore(false)
      setShowDropdown(false)
    },
  }
}

export type ProductSearch = ReturnType<typeof useProductSearch>
