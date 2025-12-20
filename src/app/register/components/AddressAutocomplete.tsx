"use client"

import { useEffect, useRef, useState } from "react"
import { getPlaceDetails, type ParsedAddress, searchPlaces } from "@/lib/utils/google-maps"

interface AddressAutocompleteProps {
  onSelect: (address: ParsedAddress) => void
  selectedAddress: ParsedAddress | null
  error?: string
}

export default function AddressAutocomplete({ onSelect, selectedAddress, error }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
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
      setQuery(selectedAddress.formattedAddress)
    }
  }, [selectedAddress])

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setPredictions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      const results = await searchPlaces(searchQuery)
      setPredictions(results)
      setShowSuggestions(true)
    } catch (err) {
      console.error("Error searching places:", err)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      const addressDetails = await getPlaceDetails(placeId)
      onSelect(addressDetails)
      setQuery(description)
      setShowSuggestions(false)
    } catch (err) {
      console.error("Error fetching place details:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="addressSearch" className="block text-sm font-medium text-gray-700 mb-2">
        Search Address *
      </label>
      <input
        id="addressSearch"
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
        disabled={isLoading}
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
      {showSuggestions && predictions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelectPlace(prediction.place_id, prediction.description)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{prediction.description}</div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
