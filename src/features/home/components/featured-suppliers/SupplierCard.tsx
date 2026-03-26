import { Award, CheckCircle, GraduationCap, Phone, ShieldCheck, Truck, Wrench } from "lucide-react"
import Image from "next/image"

interface Feature {
  icon: string
  iconColor: string
  text: string
}

interface SupplierCardProps {
  name: string
  logo: string
  alt: string
  rating: number
  starCount: number
  reviewCount: string
  features: Feature[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "check-circle": CheckCircle,
  truck: Truck,
  "shield-check": ShieldCheck,
  tools: Wrench,
  phone: Phone,
  "graduation-cap": GraduationCap,
  award: Award,
}

const colorMap: Record<string, string> = {
  green: "text-green-500",
  "steel-blue": "text-steel-blue",
}

const SupplierCard = ({ name, logo, alt, rating, starCount, reviewCount, features }: SupplierCardProps) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `${name}-star-${i + 1}`
      return (
        <svg
          key={starId}
          className={`w-4 h-4 ${i < starCount ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-label={i < starCount ? "Filled star" : "Empty star"}
        >
          <title>{i < starCount ? "Filled star" : "Empty star"}</title>
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
    <div className="bg-light-mint-gray rounded-2xl p-8 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
          <Image className="w-12 h-12 object-contain" src={logo} alt={alt} width={48} height={48} />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-semibold text-steel-blue">{name}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <div className="flex text-yellow-400 mr-2">{renderStars()}</div>
            <span>
              {rating} ({reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        {features.map((feature) => {
          const IconComponent = iconMap[feature.icon]
          const iconColorClass = colorMap[feature.iconColor] || "text-gray-500"
          return (
            <div key={feature.text} className="flex items-center text-sm text-gray-700">
              {IconComponent && <IconComponent className={`${iconColorClass} mr-2 w-4 h-4`} />}
              <span>{feature.text}</span>
            </div>
          )
        })}
      </div>
      <div className="flex space-x-3">
        <button
          type="button"
          className="flex-1 bg-steel-blue text-white py-2 px-4 rounded-lg hover:bg-opacity-90 font-medium"
        >
          View Catalog
        </button>
        <button
          type="button"
          className="px-4 py-2 border border-steel-blue text-steel-blue rounded-lg hover:bg-steel-blue hover:text-white transition-colors"
          aria-label="Add to favorites"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <title>Add to favorites</title>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default SupplierCard
