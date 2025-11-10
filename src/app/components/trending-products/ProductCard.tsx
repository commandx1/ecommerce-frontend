import { Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  title: string
  category: string
  description: string
  price: string
  originalPrice: string | null
  image: string
  alt: string
  href: string
}

const ProductCard = ({ title, category, description, price, originalPrice, image, alt, href }: ProductCardProps) => {
  return (
    <div className="bg-light-mint-gray border-steel-blue/20 border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
      <Link href={href} className="block">
        <div className="h-48 overflow-hidden bg-white">
          <Image
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            src={image}
            alt={alt}
            width={400}
            height={192}
          />
        </div>
      </Link>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{category}</span>
          <button
            type="button"
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Add to favorites"
          >
            <Heart className="w-5 h-5" fill="none" stroke="currentColor" />
          </button>
        </div>
        <Link href={href} className="block">
          <h3 className="text-lg font-semibold text-steel-blue mb-2 hover:underline">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-steel-blue">{price}</span>
            {originalPrice && <span className="text-sm text-gray-500 line-through ml-2">{originalPrice}</span>}
          </div>
          <Link
            href={href}
            className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm font-medium transition-colors inline-block"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
