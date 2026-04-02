import { Award, CheckCircle, GraduationCap, Phone, ShieldCheck, Truck, Wrench } from "lucide-react"
import Image from "next/image"
import type { ComponentType } from "react"
import StarRating from "@/features/home/components/StarRating"

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

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
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

export default function SupplierCard({ name, logo, alt, rating, starCount, reviewCount, features }: SupplierCardProps) {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
          <Image className="w-12 h-12 object-contain" src={logo} alt={alt} width={48} height={48} />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-semibold text-steel-blue">{name}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <StarRating filledCount={starCount} sizeClassName="w-4 h-4" />
            <span className="ml-2">
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
