"use client"

import CategorySelect from "./components/CategorySelect"
import SearchActionButton from "./components/SearchActionButton"
import SearchInput from "./components/SearchInput"
import SearchResultsDropdown from "./components/SearchResultsDropdown"
import { useMainSearch } from "./hooks/useMainSearch"

interface MainSearchboxProps {
  className?: string
}

const MainSearchbox = ({ className = "" }: MainSearchboxProps) => {
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
    handleImageError,
    getImageSrc,
  } = useMainSearch()

  return (
    <div
      className={`relative mx-auto flex w-full max-w-2xl rounded-2xl border border-border-soft bg-surface-elevated/95 shadow-soft backdrop-blur-sm transition-[border-color,box-shadow] focus-within:border-brand/40 focus-within:ring-3 focus-within:ring-ring/50 ${className}`}
    >
      <CategorySelect />
      <div className="relative flex-1">
        <SearchInput inputRef={inputRef} value={searchQuery} onChange={handleInputChange} onFocus={handleInputFocus} />
        <SearchResultsDropdown
          dropdownRef={dropdownRef}
          results={searchResults}
          isLoading={isLoading}
          show={showDropdown}
          getImageSrc={getImageSrc}
          onImageError={handleImageError}
          onResultClick={handleResultClick}
        />
      </div>
      <SearchActionButton isLoading={isLoading} />
    </div>
  )
}

export default MainSearchbox
