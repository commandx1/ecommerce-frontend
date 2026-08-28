"use client"

import { Check, ChevronDown, Loader2, Search, Tag, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { productsAPI } from "@/lib/api/products"
import { useDebounce } from "@/lib/hooks/useDebounce"

const PAGE_SIZE = 20
const SCROLL_THRESHOLD_PX = 48

interface BrandFilterDropdownProps {
  value: string | null
  onChange: (brand: string | null) => void
  accessToken: string | null
  disabled?: boolean
  hideAllOption?: boolean
  triggerClassName?: string
  id?: string
}

export default function BrandFilterDropdown({
  value,
  onChange,
  accessToken,
  disabled,
  hideAllOption,
  triggerClassName,
  id,
}: BrandFilterDropdownProps) {
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
  const debouncedQuery = useDebounce(query, 400)

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

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 text-left ${
          triggerClassName ??
          "h-full min-w-40 rounded-lg border border-border-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        }`}
      >
        <Tag className="w-4 h-4 text-text-muted shrink-0" />
        <span className={`flex-1 truncate text-sm ${value ? "text-text-primary" : "text-text-muted"}`}>
          {value || (hideAllOption ? "Select brand" : "All Brands")}
        </span>
        {!hideAllOption && value && (
          // biome-ignore lint/a11y/useSemanticElements: nested inside the trigger <button>, and a nested <button> is invalid HTML
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              handleSelect(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation()
                handleSelect(null)
              }
            }}
            className="text-text-muted hover:text-text-secondary"
          >
            <X className="w-4 h-4" />
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-xl border border-border-soft bg-surface-elevated shadow-xl">
          <div className="p-2 border-b border-border-soft">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brand..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          <div ref={listRef} onScroll={handleListScroll} className="max-h-64 overflow-y-auto p-1">
            {!hideAllOption && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm text-left hover:bg-surface-muted"
              >
                <span className={!value ? "font-medium text-text-primary" : "text-text-secondary"}>All Brands</span>
                {!value && <Check className="w-4 h-4 text-brand" />}
              </button>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
              </div>
            ) : error && brands.length === 0 ? (
              <div role="alert" className="px-3 py-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2 text-sm font-medium text-brand hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : brands.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-muted text-center">No brands found</p>
            ) : (
              brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleSelect(brand)}
                  className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm text-left hover:bg-surface-muted"
                >
                  <span className={value === brand ? "font-medium text-text-primary" : "text-text-secondary"}>
                    {brand}
                  </span>
                  {value === brand && <Check className="w-4 h-4 text-brand" />}
                </button>
              ))
            )}

            {isLoadingMore && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
              </div>
            )}

            {!isLoading && !isLoadingMore && error && brands.length > 0 && (
              <div role="alert" className="px-3 py-3 text-center border-t border-border-soft">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-1 text-sm font-medium text-brand hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
