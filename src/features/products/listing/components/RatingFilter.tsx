"use client"

import { Star } from "lucide-react"
import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useProductFiltersNavigation } from "../hooks/useProductFiltersNavigation"

const RATING_OPTIONS = [
  { stars: 5, label: "5 Stars" },
  { stars: 4, label: "4+ Stars" },
  { stars: 3, label: "3+ Stars" },
]

const RatingFilter = () => {
  const uid = useId()
  const { navigate, currentMinRating } = useProductFiltersNavigation()

  const toggle = (stars: number) => {
    navigate({ minRating: currentMinRating === stars ? null : stars })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Customer Rating</h3>
        {currentMinRating != null && (
          <button
            type="button"
            onClick={() => navigate({ minRating: null })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-3">
        {RATING_OPTIONS.map((option) => (
          <div key={option.stars} className="flex items-center gap-3">
            <Checkbox
              id={`${uid}-rating-${option.stars}`}
              checked={currentMinRating === option.stars}
              onChange={() => toggle(option.stars)}
            />
            <Label
              htmlFor={`${uid}-rating-${option.stars}`}
              className="flex items-center text-sm text-text-secondary cursor-pointer"
            >
              <span className="mr-2 flex text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= option.stars ? "fill-current" : "text-border-strong"}`}
                  />
                ))}
              </span>
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RatingFilter
