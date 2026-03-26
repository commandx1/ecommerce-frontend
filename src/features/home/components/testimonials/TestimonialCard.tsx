import Image from "next/image"

interface TestimonialCardProps {
  rating: number
  text: string
  author: string
  location: string
  avatar: string
}

const TestimonialCard = ({ rating, text, author, location, avatar }: TestimonialCardProps) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `${author}-star-${i + 1}`
      return (
        <svg
          key={starId}
          className={`w-5 h-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-label={i < rating ? "Filled star" : "Empty star"}
        >
          <title>{i < rating ? "Filled star" : "Empty star"}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )
    })
  }

  return (
    <div className="bg-light-mint-gray rounded-2xl p-8">
      <div className="flex text-yellow-400 mb-4">{renderStars()}</div>
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

export default TestimonialCard
