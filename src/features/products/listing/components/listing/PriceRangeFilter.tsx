"use client"

import { useEffect, useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"

const PRICE_PRESETS = [
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50 – $200", min: 50, max: 200 },
  { label: "$200 – $500", min: 200, max: 500 },
  { label: "$500 – $1,000", min: 500, max: 1000 },
  { label: "Over $1,000", min: 1000, max: null },
]

function matchPreset(min: number | null, max: number | null) {
  return PRICE_PRESETS.findIndex((p) => p.min === (min ?? 0) && p.max === max)
}

const RANGE_ERROR_MESSAGE = "Min price must not be greater than max price."

const PriceRangeFilter = () => {
  const uid = useId()
  const errorId = `${uid}-price-range-error`
  const { navigate, currentMinPrice, currentMaxPrice } = useProductFiltersNavigation()
  const [minInput, setMinInput] = useState(currentMinPrice != null ? String(currentMinPrice) : "")
  const [maxInput, setMaxInput] = useState(currentMaxPrice != null ? String(currentMaxPrice) : "")
  const [rangeError, setRangeError] = useState<string | null>(null)

  useEffect(() => {
    setMinInput(currentMinPrice != null ? String(currentMinPrice) : "")
  }, [currentMinPrice])

  useEffect(() => {
    setMaxInput(currentMaxPrice != null ? String(currentMaxPrice) : "")
  }, [currentMaxPrice])

  const hasPrice = currentMinPrice != null || currentMaxPrice != null
  const activePreset = matchPreset(currentMinPrice, currentMaxPrice)

  const applyCustom = () => {
    const min = minInput !== "" ? Number(minInput) : null
    const max = maxInput !== "" ? Number(maxInput) : null

    if (min != null && max != null && min > max) {
      setRangeError(RANGE_ERROR_MESSAGE)
      return
    }

    setRangeError(null)
    navigate({ minPrice: min, maxPrice: max })
  }

  const selectPreset = (preset: (typeof PRICE_PRESETS)[number]) => {
    setRangeError(null)
    setMinInput(preset.min > 0 ? String(preset.min) : "")
    setMaxInput(preset.max != null ? String(preset.max) : "")
    navigate({ minPrice: preset.min > 0 ? preset.min : null, maxPrice: preset.max })
  }

  const clearPrice = () => {
    setRangeError(null)
    setMinInput("")
    setMaxInput("")
    navigate({ minPrice: null, maxPrice: null })
  }

  return (
    <div className="p-6 border-b border-border-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Price Range</h3>
        {hasPrice && (
          <button
            type="button"
            onClick={clearPrice}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <Label className="block text-xs text-text-muted mb-1">Min</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-text-muted text-sm">$</span>
              <Input
                type="number"
                min={0}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-sm"
                value={minInput}
                onChange={(e) => {
                  setRangeError(null)
                  setMinInput(e.target.value)
                }}
                onBlur={applyCustom}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                aria-invalid={rangeError ? true : undefined}
                aria-describedby={rangeError ? errorId : undefined}
              />
            </div>
          </div>
          <div>
            <Label className="block text-xs text-text-muted mb-1">Max</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-text-muted text-sm">$</span>
              <Input
                type="number"
                min={0}
                placeholder="Any"
                className="w-full pl-7 pr-3 py-2 text-sm"
                value={maxInput}
                onChange={(e) => {
                  setRangeError(null)
                  setMaxInput(e.target.value)
                }}
                onBlur={applyCustom}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                aria-invalid={rangeError ? true : undefined}
                aria-describedby={rangeError ? errorId : undefined}
              />
            </div>
          </div>
        </div>

        {rangeError && (
          <p id={errorId} className="-mt-2 text-sm text-danger">
            {rangeError}
          </p>
        )}

        <div className="space-y-2">
          {PRICE_PRESETS.map((preset, idx) => (
            <div key={preset.label} className="flex items-center gap-3">
              <Radio
                id={`${uid}-price-preset-${idx}`}
                name={`${uid}-priceRange`}
                checked={activePreset === idx}
                onChange={() => selectPreset(preset)}
              />
              <Label htmlFor={`${uid}-price-preset-${idx}`} className="text-sm text-text-secondary cursor-pointer">
                {preset.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PriceRangeFilter
