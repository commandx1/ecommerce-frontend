import { Star } from "lucide-react"

const RatingFilter = () => {
  const ratingOptions = [
    { stars: 5, label: "5 Stars", count: 567 },
    { stars: 4, label: "4+ Stars", count: 1234 },
    { stars: 3, label: "3+ Stars", count: 1789 },
  ]

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Customer Rating</h3>
      <div className="space-y-3">
        {ratingOptions.map((option) => (
          <label key={option.stars} className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="form-checkbox text-steel-blue h-4 w-4 rounded border-gray-300 focus:ring-steel-blue"
            />
            <div className="ml-3 flex items-center">
              <div className="flex text-yellow-400 mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= option.stars ? "fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-700 group-hover:text-steel-blue transition-colors">
                {option.label}
              </span>
            </div>
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default RatingFilter

