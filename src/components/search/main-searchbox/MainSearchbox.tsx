"use client"

import { useRef } from "react"
import { useGlassMorph } from "@/components/ui/glass-morph-menu"
import { glassDarkTintClass, LiquidGlass } from "@/components/ui/liquid-glass"
import { cn } from "@/lib/utils"
import SearchActionButton from "./components/SearchActionButton"
import SearchInput from "./components/SearchInput"
import SearchResultsDropdown from "./components/SearchResultsDropdown"
import { useMainSearch } from "./hooks/useMainSearch"

interface MainSearchboxProps {
  className?: string
}

const MainSearchbox = ({ className }: MainSearchboxProps) => {
  const {
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
  } = useMainSearch()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const glassRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  const open = showDropdown && (searchResults.length > 0 || isLoading)
  const rendered = useGlassMorph(open, { root: rootRef, glass: glassRef, anchor: barRef, panel: dropdownRef })

  return (
    <div
      ref={rootRef}
      className={cn(
        "group/search relative isolate mx-auto w-full max-w-2xl rounded-full",
        rendered && "z-20",
        className,
      )}
    >
      <LiquidGlass
        ref={glassRef}
        blur={24}
        // Rim wider than the panel: the whole surface refracts. Blur 6 keeps the waves visible yet calm;
        // results text sits above the glass and stays put.
        edge={999}
        rimBlur={6}
        borderRadius={22}
        // The focus ring lives on the glass so it follows the grown shape instead of outlining the input row.
        className={cn(
          "z-0 transition-none group-focus-within/search:ring-3 group-focus-within/search:ring-ring/50",
          glassDarkTintClass,
          !rendered && "after:hidden [&>[data-lg-rim]]:hidden!",
        )}
      />
      <div ref={barRef} className="relative z-10 flex w-full">
        {/* <search> gives this its accessible "search" landmark (biome's a11y rule flags the
           equivalent role="search" on a plain <form> as redundant); the <form> underneath is
           still what makes Enter submit natively. */}
        <search className="flex w-full">
          <form onSubmit={handleSubmit} className="flex w-full">
            <div className="relative flex-1">
              <SearchInput
                inputRef={inputRef}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
              />
            </div>
            <SearchActionButton isLoading={isLoading} />
          </form>
        </search>
      </div>
      <SearchResultsDropdown
        dropdownRef={dropdownRef}
        results={searchResults}
        isLoading={isLoading}
        show={rendered}
        query={trimmedQuery}
        seeAllHref={seeAllHref}
        getImageSrc={getImageSrc}
        onImageError={handleImageError}
        onResultClick={handleResultClick}
        onSeeAllClick={handleSeeAllClick}
      />
    </div>
  )
}

export default MainSearchbox
