"use client"

import { Check, ChevronDown, Loader2, Search, Tag, X } from "lucide-react"
import { useBrandFilterDropdown } from "../hooks/useBrandFilterDropdown"

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
  const {
    isOpen,
    query,
    brands,
    isLoading,
    isLoadingMore,
    error,
    containerRef,
    listRef,
    searchInputRef,
    toggleOpen,
    setQuery,
    handleListScroll,
    handleSelect,
    handleRetry,
  } = useBrandFilterDropdown({ onChange, accessToken })

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
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
