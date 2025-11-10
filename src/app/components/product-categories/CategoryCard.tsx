import Image from "next/image"

interface CategoryCardProps {
  title: string
  description: string
  productCount: string
  image: string
  alt: string
}

const CategoryCard = ({ title, description, productCount, image, alt }: CategoryCardProps) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
      <div className="h-48 overflow-hidden">
        <Image
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={image}
          alt={alt}
          width={400}
          height={192}
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-steel-blue mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{productCount} products</span>
          <svg
            className="w-5 h-5 text-steel-blue group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="View category"
          >
            <title>View category</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default CategoryCard
