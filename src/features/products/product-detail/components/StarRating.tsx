import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  max?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

const StarRating = ({ rating, max = 5, size = "md", className }: StarRatingProps) => {
  const filledCount = Math.floor(rating)
  return (
    <div className={cn("flex items-center", className)} aria-label={`Rated ${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < filledCount
        return (
          <Star
            key={`star-${index + 1}`}
            className={cn(sizeClasses[size], filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
          />
        )
      })}
    </div>
  )
}

export default StarRating
