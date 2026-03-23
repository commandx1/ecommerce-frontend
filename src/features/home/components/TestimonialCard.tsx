import Image from "next/image"
import StarRating from "@/features/home/components/StarRating"

interface TestimonialCardProps {
  rating: number
  text: string
  author: string
  location: string
  avatar: string
}

export default function TestimonialCard({ rating, text, author, location, avatar }: TestimonialCardProps) {
  return (
    <div className="bg-light-mint-gray rounded-2xl p-8">
      <div className="mb-4">
        <StarRating filledCount={rating} sizeClassName="w-5 h-5" />
      </div>
      <p className="text-gray-700 mb-6 leading-relaxed">&quot;{text}&quot;</p>
      <div className="flex items-center">
        <Image src={avatar} alt={author} className="w-12 h-12 rounded-full mr-4" width={48} height={48} />
        <div>
          <div className="font-semibold text-steel-blue">{author}</div>
          <div className="text-sm text-gray-600">{location}</div>
        </div>
      </div>
    </div>
  )
}
