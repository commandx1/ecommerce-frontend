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
    <div className={`flex w-full max-w-2xl mx-auto relative ${className}`}>
      <CategorySelect />
      <div className="flex-1 relative">
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
