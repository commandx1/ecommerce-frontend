import { Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const RatingFilter = () => {
  const ratingOptions = [
    { stars: 5, label: "5 Stars", count: 567 },
    { stars: 4, label: "4+ Stars", count: 1234 },
    { stars: 3, label: "3+ Stars", count: 1789 },
  ]

  return (
    <div className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Customer Rating</h3>
      <div className="space-y-3">
        {ratingOptions.map((option) => (
          <div key={option.stars} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox id={`rating-${option.stars}`} />
              <Label htmlFor={`rating-${option.stars}`} className="flex items-center text-sm text-text-secondary">
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
            <span className="text-xs text-text-muted">({option.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RatingFilter
