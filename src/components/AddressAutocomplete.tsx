"use client"

import type { ChangeEvent } from "react"
import { useEffect, useId, useRef, useState } from "react"
import { getPlaceDetails, type ParsedAddress, searchPlaces } from "@/lib/utils/google-maps"

interface AddressAutocompleteProps {
  onSelect: (address: ParsedAddress) => void
  selectedAddress: ParsedAddress | null
  error?: string
}

export default function AddressAutocomplete({ onSelect, selectedAddress, error }: AddressAutocompleteProps) {
  const addressSearchId = useId()
  const [query, setQuery] = useState("")
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (selectedAddress) {
      setQuery(selectedAddress.addressLine || selectedAddress.formattedAddress)
    }
  }, [selectedAddress])

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setPredictions([])
      setShowSuggestions(false)
      setSearchError(null)
      return
    }

    setIsLoading(true)
    setSearchError(null)
    try {
      const results = await searchPlaces(searchQuery)
      setPredictions(results)
      setShowSuggestions(true)
    } catch (err) {
      console.error("Error searching places:", err)
      setPredictions([])
      setShowSuggestions(false)
      // Without this the buyer sees no suggestions and no explanation - they can't tell an
      // outage from having typed the wrong thing, and the Save button below stays disabled
      // forever with no clue why. Surfacing it lets them understand and retry (once Places
      // recovers, typing again re-triggers a search) instead of silently getting stuck.
      setSearchError("We couldn't search for addresses right now. Please try again in a moment.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  const handleSelectPlace = async (placeId: string, description: string) => {
    setIsLoading(true)
    setSearchError(null)
    try {
      const addressDetails = await getPlaceDetails(placeId)
      onSelect(addressDetails)
      setQuery(addressDetails.addressLine || description)
      setShowSuggestions(false)
    } catch (err) {
      console.error("Error fetching place details:", err)
      setSearchError("We couldn't load that address's details. Please try selecting it again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={addressSearchId} className="block text-sm font-medium text-gray-700 mb-2">
        Search Address *
      </label>
      <input
        id={addressSearchId}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          if (predictions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        className={`w-full px-4 py-3 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
        placeholder="Search address..."
      />
      {isLoading && (
        <div className="absolute right-3 top-10 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <title>Loading...</title>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
      {/* A listbox is not a list: an interactive ARIA role on <ul>/<li> is invalid, so the
          container and its rows are plain elements that carry the roles themselves. Each
          suggestion is a real <button> so keyboard users can Tab to it and press Enter. */}
      {showSuggestions && predictions.length > 0 && (
        <div
          role="listbox"
          aria-label="Address suggestions"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {predictions.map((prediction) => (
            <div key={prediction.place_id} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handleSelectPlace(prediction.place_id, prediction.description)}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium text-gray-900">{prediction.description}</div>
              </button>
            </div>
          ))}
        </div>
      )}
      {searchError && (
        <p role="alert" className="text-red-500 text-sm mt-1">
          {searchError}
        </p>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
